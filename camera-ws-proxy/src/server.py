import asyncio
import logging
from typing import Dict
from pathlib import Path
import subprocess
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from starlette.websockets import WebSocketState # For checking WebSocket state
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from .config import Config, CameraConfig
from .camera import CameraStream

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG) # Changed to DEBUG to see chunk logs

class CameraServer:
    def __init__(self):
        self.app = FastAPI(title="Camera Stream Proxy")
        self.config = Config.load_default()
        self.cameras: Dict[str, CameraStream] = {}
        self.transcoders: Dict[str, subprocess.Popen] = {}

        # Create streams directory for HLS
        self.streams_dir = Path("streams")
        self.streams_dir.mkdir(exist_ok=True)

        # Setup CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # Register routes
        self.setup_routes()

    def setup_routes(self):
        # Mount static files for HLS streams
        self.app.mount("/streams", StaticFiles(directory="streams"), name="streams")
        # Mount static files for web player
        self.app.mount("/static", StaticFiles(directory="static"), name="static")

        @self.app.get("/cameras")
        async def list_cameras():
            cameras = []
            for cam_id, cam in self.config.cameras.items():
                hls_ready = (self.streams_dir / cam_id / "index.m3u8").exists()
                cameras.append({
                    "id": cam_id,
                    "name": cam.name,
                    "location": cam.location,
                    "enabled": cam.enabled,
                    "resolution": cam.resolution,
                    "status": {
                        "websocket": cam_id in self.cameras,
                        "hls": hls_ready
                    }
                })
            return {"cameras": cameras}

        @self.app.post("/cameras/{camera_id}/hls/start")
        async def start_hls(camera_id: str):
            if camera_id not in self.config.cameras:
                raise HTTPException(status_code=404, detail=f"Camera {camera_id} not found")

            camera_config = self.config.cameras[camera_id]
            if not camera_config.enabled:
                raise HTTPException(status_code=400, detail=f"Camera {camera_id} is disabled")

            output_dir = self.streams_dir / camera_id
            output_dir.mkdir(parents=True, exist_ok=True)
            output_path = output_dir / "index.m3u8"

            if camera_id in self.transcoders and self.transcoders[camera_id].poll() is None:
                return {"status": "already running", "hls_url": f"/streams/{camera_id}/index.m3u8"}

            cmd = [
                "ffmpeg",
                "-fflags", "nobuffer",
                "-flags", "low_delay",
                "-strict", "experimental",
                "-probesize", "32",
                "-analyzeduration", "0",
                "-i", f"tcp://{camera_config.ip_address}:{camera_config.port}",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-tune", "zerolatency",
                "-f", "hls",
                "-hls_time", "1",
                "-hls_list_size", "5",
                "-hls_flags", "delete_segments+omit_endlist",
                "-progress", "pipe:2",    # Output progress to stderr
                str(output_path)
            ]

            logger.info(f"Starting ffmpeg for HLS: {' '.join(cmd)}")
            try:
                proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                self.transcoders[camera_id] = proc
            except Exception as e:
                logger.error(f"Failed to start ffmpeg: {e}")
                raise HTTPException(status_code=500, detail="Failed to start HLS stream")

            return {"status": "started", "hls_url": f"/streams/{camera_id}/index.m3u8"}

        @self.app.post("/cameras/{camera_id}/hls/stop")
        async def stop_hls(camera_id: str):
            proc = self.transcoders.get(camera_id)
            if proc:
                proc.terminate()
                proc.wait()
                del self.transcoders[camera_id]
            return {"status": "stopped"}

        @self.app.websocket("/stream/{camera_id}")
        async def stream_proxy(websocket: WebSocket, camera_id: str):
            """Proxy camera stream over WebSocket as MPEG-TS"""
            logger.info(f"MPEG-TS WebSocket connection request for camera {camera_id}")

            if camera_id not in self.config.cameras:
                logger.warning(f"Camera {camera_id} not found")
                # Use appropriate WebSocket close codes
                await websocket.close(code=1008, reason=f"Camera {camera_id} not found") # 1008 Policy Violation
                return

            camera_config = self.config.cameras[camera_id]
            if not camera_config.enabled:
                logger.warning(f"Camera {camera_id} is disabled")
                await websocket.close(code=1008, reason=f"Camera {camera_id} is disabled")
                return

            await websocket.accept()
            logger.info(f"Accepted MPEG-TS WebSocket connection for camera {camera_id}")

            ffmpeg_cmd = [
                "ffmpeg",
                # "-hide_banner",
                "-loglevel", "info",
                "-fflags", "+igndts",
                "-re", # Read input at native rate
                "-i", f"tcp://{camera_config.ip_address}:{camera_config.port}",
                "-c:v", "mpeg1video",     # CRITICAL: Encode to MPEG1 video
                "-bf", "0",               # No B-frames (recommended for JSMpeg)
                "-vf", "scale=800:450",   # Scale output video
                "-b:v", "500k",          # Target bitrate
                "-f", "mpegts",           # Output MPEG-TS container
                "-muxdelay", "0.01",      # Small mux delay
                "-an",                     # No audio
                "-progress", "pipe:2",    # Output progress to stderr
                "pipe:1"                  # Output to stdout
            ]

            process = None
            stderr_logger_task = None
            try:
                logger.info(f"Starting FFmpeg for MPEG-TS: {' '.join(ffmpeg_cmd)}")
                process = await asyncio.create_subprocess_exec(
                    *ffmpeg_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE  # Capture stderr
                )
                logger.info(f"FFmpeg process started for {camera_id}. PID: {process.pid}")

                # Coroutine to log FFmpeg's stderr
                async def log_ffmpeg_stderr():
                    while True:
                        line = await process.stderr.readline()
                        if not line:
                            logger.info(f"FFmpeg stderr stream ended for {camera_id}.")
                            break
                        logger.error(f"FFmpeg stderr [{camera_id}]: {line.decode(errors='ignore').strip()}")
                
                stderr_logger_task = asyncio.create_task(log_ffmpeg_stderr())

                # Read from FFmpeg's stdout and send to WebSocket
                READ_CHUNK_SIZE = 65536
                while True:
                    chunk = await process.stdout.read(READ_CHUNK_SIZE)
                    if not chunk:
                        logger.info(f"FFmpeg stdout stream ended for {camera_id}. FFmpeg might have exited.")
                        break
                    logger.debug(f"Read {len(chunk)} bytes from FFmpeg for {camera_id}, sending to WebSocket.")
                    await websocket.send_bytes(chunk)
                    logger.debug(f"Sent {len(chunk)} bytes to WebSocket for {camera_id}.")
            
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected by client for camera {camera_id}")
            except ConnectionResetError:
                logger.info(f"Client connection reset for camera {camera_id}")
            except Exception as e:
                logger.error(f"Error in MPEG-TS stream proxy for {camera_id}: {type(e).__name__} - {e}")
            finally:
                if stderr_logger_task and not stderr_logger_task.done():
                    stderr_logger_task.cancel()
                    try:
                        await stderr_logger_task
                    except asyncio.CancelledError:
                        logger.info(f"FFmpeg stderr logger task cancelled for {camera_id}.")
                    except Exception as e_log_cancel:
                        logger.error(f"Error awaiting cancelled stderr_logger_task for {camera_id}: {e_log_cancel}")

                if process and process.returncode is None:
                    logger.info(f"FFmpeg process for {camera_id} (PID: {process.pid}) still running. Terminating...")
                    try:
                        process.terminate()
                        # Give it a moment to terminate gracefully
                        await asyncio.wait_for(process.wait(), timeout=5.0) 
                        logger.info(f"FFmpeg process for {camera_id} terminated with code {process.returncode}.")
                    except asyncio.TimeoutError:
                        logger.warning(f"Timeout terminating FFmpeg for {camera_id}, killing. PID: {process.pid}")
                        process.kill()
                        await process.wait()
                        logger.info(f"FFmpeg process for {camera_id} killed. Return code: {process.returncode}")
                    except Exception as e_term:
                        logger.error(f"Error during FFmpeg termination for {camera_id}: {e_term}")
                elif process:
                    logger.info(f"FFmpeg process for {camera_id} (PID: {process.pid}) already exited with code {process.returncode}.")
                
                logger.info(f"Closing WebSocket connection for {camera_id}")
                try:
                    # Check current state before attempting to close
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.close()
                        logger.info(f"WebSocket connection for {camera_id} closed programmatically.")
                    else:
                        logger.info(f"WebSocket for {camera_id} already in state: {websocket.client_state}")
                except RuntimeError as e_ws_close: # Catches errors like "Connection is already closed"
                    logger.warning(f"RuntimeError while closing websocket for {camera_id}: {e_ws_close}")
                except Exception as e_ws_close_generic:
                    logger.error(f"Generic error while closing websocket for {camera_id}: {e_ws_close_generic}")
                    proc.terminate()
                    await proc.wait()

    def get_app(self) -> FastAPI:
        return self.app
