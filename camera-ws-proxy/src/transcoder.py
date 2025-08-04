import os
import subprocess
import logging
import threading
import time
from typing import Dict, Optional
from pathlib import Path

from .config import CameraConfig

logger = logging.getLogger(__name__)

class StreamTranscoder:
    def __init__(self, stream_root: str = "streams"):
        self.stream_root = Path(stream_root)
        self.stream_root.mkdir(exist_ok=True)
        self.transcoders: Dict[str, subprocess.Popen] = {}
        self._lock = threading.Lock()

    def get_hls_path(self, camera_id: str) -> Path:
        """Get the HLS output directory for a camera"""
        return self.stream_root / camera_id

    def get_playlist_path(self, camera_id: str) -> Path:
        """Get the m3u8 playlist path for a camera"""
        return self.get_hls_path(camera_id) / "index.m3u8"

    def start_transcoder(self, camera_id: str, config: CameraConfig) -> bool:
        """Start an FFmpeg process to transcode the camera stream to HLS"""
        with self._lock:
            if camera_id in self.transcoders and self.transcoders[camera_id].poll() is None:
                logger.info(f"Transcoder for camera {camera_id} is already running")
                return True

            hls_path = self.get_hls_path(camera_id)
            hls_path.mkdir(parents=True, exist_ok=True)
            # Ensure directory has correct permissions
            os.chmod(str(hls_path), 0o755)
            playlist_path = self.get_playlist_path(camera_id)

            # Add verbose logging to FFmpeg
            cmd = [
                "ffmpeg",
                "-loglevel", "debug",  # More detailed logging
                "-i", f"tcp://{config.ip_address}:{config.port}",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-tune", "zerolatency",
                "-f", "hls",
                "-hls_time", "1",              # Each segment is 1 second
                "-hls_list_size", "3",         # Keep only 3 segments in the playlist
                "-hls_flags", "delete_segments+append_list",  # Delete old segments and append to list
                "-hls_segment_type", "mpegts",  # Use MPEG-TS segments for lower latency
                "-hls_init_time", "1",         # Start the first segment after 1 second
                "-hls_segment_filename", str(hls_path.absolute() / "segment_%03d.ts"),
                str(playlist_path.absolute())
            ]
            logger.info(f"Starting FFmpeg with command: {' '.join(cmd)}")

            try:
                # Start FFmpeg process with output redirection
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    universal_newlines=True,
                    cwd=str(self.stream_root)  # Set working directory to streams folder
                )
                self.transcoders[camera_id] = process
                
                # Start a thread to monitor FFmpeg output
                def monitor_output():
                    for line in process.stderr:
                        logger.info(f"FFmpeg [{camera_id}]: {line.strip()}")
                    process.stdout.close()
                    process.stderr.close()
                
                threading.Thread(target=monitor_output, daemon=True).start()
                
                # Wait a bit to check if FFmpeg starts successfully
                time.sleep(1)
                if process.poll() is not None:
                    error = process.stderr.read()
                    logger.error(f"FFmpeg failed to start: {error}")
                    return False
                
                logger.info(f"Started HLS transcoder for camera {camera_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to start transcoder for camera {camera_id}: {str(e)}")
                return False

    def stop_transcoder(self, camera_id: str) -> None:
        """Stop the FFmpeg transcoder for a camera"""
        with self._lock:
            if camera_id in self.transcoders:
                process = self.transcoders[camera_id]
                if process.poll() is None:  # Still running
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                del self.transcoders[camera_id]
                logger.info(f"Stopped HLS transcoder for camera {camera_id}")

    def cleanup(self) -> None:
        """Stop all transcoders"""
        with self._lock:
            for camera_id in list(self.transcoders.keys()):
                self.stop_transcoder(camera_id)

    def is_transcoding(self, camera_id: str) -> bool:
        """Check if a camera is currently being transcoded"""
        with self._lock:
            if camera_id not in self.transcoders:
                return False
            process = self.transcoders[camera_id]
            if process.poll() is not None:  # Process has ended
                del self.transcoders[camera_id]
                return False
            return True
