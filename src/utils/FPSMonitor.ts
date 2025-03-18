export class FPSMonitor {
  private frames: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;

  constructor() {
    this.lastTime = performance.now();
  }

  update(): void {
    this.frames++;
    const currentTime = performance.now();
    const delta = currentTime - this.lastTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frames = 0;
      this.lastTime = currentTime;
    }
  }

  getFPS(): number {
    return this.fps;
  }
} 