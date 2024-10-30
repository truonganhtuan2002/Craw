export interface IpcRenderer {
    send(channel: string, ...args: unknown[]): void;
    invoke(channel: string, ...args: unknown[]): Promise<unknown>;
    on(
      channel: string,
      listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void
    ): this
    removeListener(channel: string, listener: (...args: unknown[]) => void): this;
  }
  
  declare global {
    interface Window {
      electron: {
        [x: string]: any;
        ipcRenderer: IpcRenderer;
      };
    }
  }
  