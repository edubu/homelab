"use client";

import { useEffect, useRef, useState } from "react";
import JSMpeg from "@cycjimmy/jsmpeg-player";
import { Camera } from "../services/CameraService";

interface CameraStreamProps {
  camera: Camera;
  onStatusChange?: (status: StreamStatus) => void;
}

export interface StreamStatus {
  state: "connecting" | "connected" | "error" | "disconnected";
  message: string;
}

export default function CameraStream({
  camera,
  onStatusChange,
}: CameraStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<StreamStatus>({
    state: "connecting",
    message: "Connecting to camera...",
  });
  // const [player, setPlayer] = useState<JSMpeg | null>(null);

  const updateStatus = (newStatus: StreamStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  };

  useEffect(() => {
    if (!camera.enabled) {
      updateStatus({ state: "error", message: "Camera is disabled" });
      return;
    }

    let playerInstance: JSMpeg | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      console.log(`[Camera ${camera.id}] Attempting to connect...`);
      updateStatus({ state: "connecting", message: "Connecting to camera..." });

      try {
        const wsUrl = `wss://camerawsproxy.internal.com/stream/${camera.id}`;
        console.log(
          `[Camera ${camera.id}] Initializing JSMpeg with WebSocket URL: ${wsUrl}`
        );

        if (!canvasRef.current) {
          console.error(`[Camera ${camera.id}] Canvas reference is null`);
          updateStatus({
            state: "error",
            message: "Canvas element not found",
          });
          return;
        }

        try {
          console.log(`[Camera ${camera.id}] Initializing JSMpeg player...`);
          playerInstance = new JSMpeg({
            url: wsUrl,
            canvas: canvasRef.current,
            autoplay: true,
            audio: false,
            streaming: true,
            pauseWhenHidden: false,
            onSourceEstablished: () => {
              console.log(`[Camera ${camera.id}] MPEG source established`);
              updateStatus({
                state: "connected",
                message: "Connected to camera feed",
              });
            },
            onSourceCompleted: () => {
              console.log(`[Camera ${camera.id}] MPEG source completed`);
            },
            onStalled: () => {
              console.warn(`[Camera ${camera.id}] Playback stalled`);
            },
            onError: (error: Error) => {
              console.error(`[Camera ${camera.id}] JSMpeg error:`, error);
              updateStatus({
                state: "error",
                message: "Video playback error",
              });
            },
          });
          // setPlayer(playerInstance);
          console.log(`[Camera ${camera.id}] JSMpeg player initialized`);
        } catch (err) {
          console.error(
            `[Camera ${camera.id}] Failed to initialize JSMpeg:`,
            err
          );
          updateStatus({
            state: "error",
            message: "Failed to initialize video player",
          });
          reconnectTimeout = setTimeout(connect, 3000);
        }
      } catch (err) {
        console.error(
          `[Camera ${camera.id}] Failed to establish connection:`,
          err
        );
        updateStatus({
          state: "error",
          message: "Failed to establish connection",
        });
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (playerInstance) {
        console.log(`[Camera ${camera.id}] Cleaning up player instance`);
        playerInstance.destroy();
        // setPlayer(null);
      }
    };
  }, [camera, updateStatus]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{camera.name}</h3>
            <p className="text-sm text-gray-500">{camera.location}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                {
                  connected: "bg-green-500",
                  connecting: "bg-yellow-500 animate-pulse",
                  error: "bg-red-500",
                  disconnected: "bg-gray-500",
                }[status.state]
              }`}
            />
            <span className="text-sm text-gray-600">{status.message}</span>
          </div>
        </div>
      </div>

      <div className="aspect-video relative">
        {status.state === "error" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-gray-600">{status.message}</p>
            </div>
          </div>
        ) : status.state === "connecting" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">{status.message}</p>
            </div>
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          width={camera.resolution[0]}
          height={camera.resolution[1]}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
