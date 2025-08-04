from typing import Dict, Optional
from pydantic import BaseModel, Field


class CameraConfig(BaseModel):
    id: str
    name: str
    ip_address: str
    port: int
    location: Optional[str] = None
    resolution: Dict[str, int] = Field(default_factory=lambda: {"width": 1280, "height": 720})
    framerate: int = 30
    enabled: bool = True


class Config(BaseModel):
    cameras: Dict[str, CameraConfig]

    @classmethod
    def load_default(cls) -> "Config":
        return cls(cameras={
            "test-camera": CameraConfig(
                id="test-camera",
                name="Test Camera",
                ip_address="100.86.137.16",
                port=8888,
                location="Test Location"
            )
        })
