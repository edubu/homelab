# WebSocket Proxy Server for RPi Camera Stream

This FastAPI server acts as a proxy between the Raspberry Pi's TCP video stream and browser WebSocket clients.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Update the camera configuration in `main.py`:
```python
camera_host = "192.168.1.100"  # Replace with your RPi's IP
camera_port = 8888             # Your libcamera-vid TCP port
```

3. Start the server:
```bash
python main.py
```

The server will run on `http://localhost:3001` with WebSocket endpoint at `ws://localhost:3001/stream/{camera_id}`.

## How it works

1. The server creates a WebSocket endpoint that browsers can connect to
2. When a client connects, the server:
   - Establishes a TCP connection to your RPi's video stream
   - Forwards the H264 video data to the WebSocket client
   - Handles reconnection and cleanup

## Configuration

- The server allows CORS from `http://localhost:3000` (your Next.js frontend)
- TCP buffer size is set to 8192 bytes (adjust if needed)
- Logging is enabled for debugging
