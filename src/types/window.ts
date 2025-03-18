import * as PIXI from 'pixi.js';
import { Container } from 'pixi.js';

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
    container: Container;
    position: { x: number; y: number };
    size: { width: number; height: number };
    titleHeight: number;
    minWidth: number;
    minHeight: number;
    minimized: boolean;
    bringToFront(): void;
    setTitle(title: string): void;
    setPosition(x: number, y: number): void;
    setSize(width: number, height: number): void;
    toggleMinimize(): void;
    draw(): void;
} 