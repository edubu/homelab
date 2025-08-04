declare module '@cycjimmy/jsmpeg-player' {
  interface JSMpegOptions {
    url: string;
    canvas: HTMLCanvasElement;
    autoplay?: boolean;
    audio?: boolean;
    video?: boolean;
    poster?: string;
    pauseWhenHidden?: boolean;
    disableGl?: boolean;
    disableWebAssembly?: boolean;
    preserveDrawingBuffer?: boolean;
    progressive?: boolean;
    throttled?: boolean;
    chunkSize?: number;
    maxAudioLag?: number;
    videoBufferSize?: number;
    audioBufferSize?: number;
    streaming?: boolean;
    onSourceEstablished?: () => void;
    onSourceCompleted?: () => void;
    onStalled?: () => void;
    onError?: (error: Error) => void;
  }

  class JSMpeg {
    constructor(options: JSMpegOptions);
    play(): void;
    pause(): void;
    stop(): void;
    destroy(): void;
    volume: number;
    currentTime: number;
    readonly duration: number;
  }

  export = JSMpeg;
}
