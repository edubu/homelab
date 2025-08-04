import asyncio
import logging
from typing import AsyncGenerator, Optional
import socket
from contextlib import asynccontextmanager

from .config import CameraConfig

logger = logging.getLogger(__name__)

class CameraStream:
    def __init__(self, config: CameraConfig):
        self.config = config
        self._socket = None
        self._connected = False
        self._loop = asyncio.get_event_loop()

    @property
    def is_connected(self) -> bool:
        return self._connected and self._socket is not None

    async def connect(self) -> None:
        """Connect to the camera TCP stream"""
        if self.is_connected:
            return

        try:
            self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            await self._loop.sock_connect(self._socket, (self.config.ip_address, self.config.port))
            self._socket.setblocking(False)
            self._connected = True
            logger.info(f"Connected to camera {self.config.id} at {self.config.ip_address}:{self.config.port}")
        except Exception as e:
            if self._socket:
                self._socket.close()
            self._socket = None
            self._connected = False
            logger.error(f"Failed to connect to camera: {str(e)}")
            raise ConnectionError(f"Failed to connect to camera {self.config.id}: {str(e)}")

    async def disconnect(self) -> None:
        """Disconnect from the camera stream"""
        logger.info("Disconnecting from camera")
        if self._socket:
            try:
                self._socket.close()
                logger.info("Camera disconnected successfully")
            except Exception as e:
                logger.error(f"Error disconnecting from camera: {str(e)}")
            finally:
                self._socket = None
                self._connected = False
        logger.info(f"Disconnected from camera {self.config.id}")

    @asynccontextmanager
    async def stream(self) -> AsyncGenerator["CameraStream", None]:
        """Context manager for camera stream"""
        await self.connect()
        try:
            yield self
        finally:
            await self.disconnect()

    async def read_chunk(self, chunk_size: int = 8192) -> bytes:
        """Read a chunk of data from the camera stream"""
        if not self.is_connected:
            logger.error("Attempted to read from disconnected camera")
            raise ConnectionError("Not connected to camera stream")

        try:
            # Use asyncio's sock_recv for non-blocking reads
            data = await self._loop.sock_recv(self._socket, chunk_size)
            if not data:
                logger.warning("Camera stream returned no data")
                raise ConnectionError("Camera stream ended")
            return data
        except Exception as e:
            logger.error(f"Error reading from camera: {str(e)}")
            await self.disconnect()
            raise ConnectionError(f"Error reading from camera stream: {str(e)}")
