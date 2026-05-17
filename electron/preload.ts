import { contextBridge, ipcRenderer } from 'electron';

const api = {
  /* sc api */
  sc: <T = any>(method: string, ...args: unknown[]) =>
    ipcRenderer.invoke('sc:call', method, args) as Promise<T>,

  /* auth */
  auth: {
    login: () => ipcRenderer.invoke('auth:login') as Promise<{ token: string | null; me: any }>,
    loadExisting: () =>
      ipcRenderer.invoke('auth:loadExisting') as Promise<{ token: string | null; me: any }>,
    logout: () => ipcRenderer.invoke('auth:logout') as Promise<boolean>,
  },

  /* window controls */
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized') as Promise<boolean>,
  },

  /* discord rpc */
  rpc: {
    set: (payload: { title: string; artist: string; artwork?: string | null; durationMs?: number; positionMs?: number }) =>
      ipcRenderer.invoke('rpc:set', payload),
    clear: () => ipcRenderer.invoke('rpc:clear'),
  },

  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },

  /* media keys */
  onMedia: (handler: (event: 'playpause' | 'next' | 'prev' | 'stop') => void) => {
    const map = ['playpause', 'next', 'prev', 'stop'] as const;
    const offs: Array<() => void> = [];
    for (const e of map) {
      const fn = () => handler(e);
      ipcRenderer.on(`media:${e}`, fn);
      offs.push(() => ipcRenderer.removeListener(`media:${e}`, fn));
    }
    return () => offs.forEach((o) => o());
  },
};

contextBridge.exposeInMainWorld('wavebox', api);

export type WaveboxApi = typeof api;
