import type { WaveboxApi } from '../electron/preload';

declare global {
  interface Window {
    wavebox: WaveboxApi;
  }
}

export {};
