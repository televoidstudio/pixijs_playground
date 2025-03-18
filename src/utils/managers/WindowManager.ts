import { FloatingWindow } from '../../components/window/FloatingWindow';
import { IFloatingWindow } from '../../types/window';
import * as PIXI from 'pixi.js';

export class WindowManager {
  private static instance: WindowManager;
  private windows: Map<string, IFloatingWindow> = new Map();

  private constructor() {
    this.setupEvents();
  }

  public static getInstance(): WindowManager {
    if (!WindowManager.instance) {
      WindowManager.instance = new WindowManager();
    }
    return WindowManager.instance;
  }

  private setupEvents(): void {
    // 設置事件監聽器
  }

  public createWindow(app: PIXI.Application): IFloatingWindow {
    const id = `window-${Date.now()}`;
    const window = new FloatingWindow(app);
    this.windows.set(id, window);
    return window;
  }

  public addWindow(window: IFloatingWindow): void {
    this.windows.set(window.id, window);
  }

  public removeWindow(id: string): void {
    const window = this.windows.get(id);
    if (window) {
      window.container.destroy();
      this.windows.delete(id);
    }
  }

  public getWindow(id: string): IFloatingWindow | undefined {
    return this.windows.get(id);
  }

  public destroy(): void {
    this.windows.forEach(window => {
      window.container.destroy();
    });
    this.windows.clear();
  }
} 