"use client";

import { useEffect, useState } from "react";
import { Camera, CameraService } from "@/app/services/CameraService";
import CameraStream, { StreamStatus } from "@/app/components/CameraStream";

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [cameraStatuses, setCameraStatuses] = useState<Record<string, StreamStatus>>({});

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setLoading(true);
        setError(null);
        const cameraList = await CameraService.listCameras();
        setCameras(cameraList);
      } catch (err) {
        setError("Failed to fetch cameras");
        console.error("Error fetching cameras:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, []);

  const handleStatusChange = (cameraId: string, status: StreamStatus) => {
    // setCameraStatuses(prev => ({
    //   ...prev,
    //   [cameraId]: status
    // }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading cameras...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto text-red-500 mb-4"
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
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No Cameras Found
        </h2>
        <p className="text-gray-500">
          No cameras are currently configured in the system.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Live Camera Feeds</h1>
        <div className="text-sm text-gray-600">
          {cameras.length} {cameras.length === 1 ? "camera" : "cameras"}{" "}
          available
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* {cameras.map(camera => (
          <CameraStream
            key={camera.id}
            camera={camera}
            onStatusChange={(status) => handleStatusChange(camera.id, status)}
          />
        ))} */}
      </div>
    </div>
  );
}
