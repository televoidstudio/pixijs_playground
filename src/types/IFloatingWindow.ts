import * as PIXI from "pixi.js";

export interface IWindowPosition {
  x: number;
  y: number;
}

export interface IWindowSize {
  width: number;
  height: number;
}

export interface IWindowStyle {
  background: number;
  titleBar: number;
  buttons: {
    close: number;
    minimize: number;
  };
}

export interface IWindowConfig {
  style: IWindowStyle;
  dimensions: {
    titleHeight: number;
    minWidth: number;
    minHeight: number;
    buttonSize: number;
  };
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
  bringToFront(): void;
} 