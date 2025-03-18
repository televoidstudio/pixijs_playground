import { FloatingWindow } from '../../components/window/FloatingWindow';
import { IFloatingWindow } from '../../types/window';

export class WindowManager {
  private windows: Map<string, IFloatingWindow> = new Map();

  constructor() {
    this.setupEvents();
  }

  private setupEvents(): void {
    // 設置事件監聽器
  }

  public createWindow(id: string, x: number, y: number, width: number, height: number): IFloatingWindow {
    const window = new FloatingWindow(id, x, y, width, height);
    this.windows.set(id, window);
    return window;
  }

  public getWindow(id: string): IFloatingWindow | undefined {
    return this.windows.get(id);
  }

  public destroy(): void {
    this.windows.clear();
  }
} 