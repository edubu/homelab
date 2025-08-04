export interface CameraStatus {
  websocket: boolean;
  hls: boolean;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  enabled: boolean;
  resolution: [number, number];
  status: CameraStatus;
}

export interface CamerasResponse {
  cameras: Camera[];
}

const API_BASE_URL = 'https://camerawsproxy.internal.com';

export const CameraService = {
  async listCameras(): Promise<Camera[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/cameras`);
      if (!response.ok) {
        throw new Error("Failed to fetch cameras");
      }
      const data: CamerasResponse = await response.json();
      return data.cameras;
    } catch (error) {
      console.error("Error fetching cameras:", error);
      throw error;
    }
  },

  getStreamUrl(cameraId: string): string {
    return `wss://camerawsproxy.internal.com/stream/${cameraId}`;
  },
};
