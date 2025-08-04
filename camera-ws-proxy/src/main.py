import logging
from .server import CameraServer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Create the FastAPI app
server = CameraServer()
app = server.app  # Export the FastAPI app instance

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False # Disable auto-reload for testing FFmpeg stability
    )
