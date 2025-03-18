import * as PIXI from "pixi.js";

export interface IWindowPosition {
  x: number;
  y: number;
}

export interface IWindowSize {
  width: number;
  height: number;
}

export interface IFloatingWindow {
  id: string;
  container: PIXI.Container;
  position: IWindowPosition;
  size: IWindowSize;
  titleHeight: number;
  minWidth: number;
  minHeight: number;
  minimized: boolean;
  
  getContentContainer(): PIXI.Container;
  draw(): void;
  enableDrag(): void;
  enableResize(): void;
  enableClose(): void;
  enableMinimize(): void;
  toggleMinimize(): void;
  destroy(): void;
} 