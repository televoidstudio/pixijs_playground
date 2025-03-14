import * as PIXI from "pixi.js";

export interface IFloatingWindow {
    container: PIXI.Container;
    width: number;
    height: number;
    titleHeight: number;
    minWidth: number;
    minHeight: number;
    draw(): void;
    enableDrag(): void;
    enableResize(): void;
}