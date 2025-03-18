import * as PIXI from 'pixi.js';
import { IPixiManager } from '../../types/IPixiManager';

export class PixiManager implements IPixiManager {
    private container: HTMLDivElement;
    public app: PIXI.Application | null = null;

    constructor(container: HTMLDivElement) {
        this.container = container;
    }

    public async init(): Promise<void> {
        if (this.app) return;

        this.app = new PIXI.Application({
            resizeTo: this.container,
            backgroundColor: 0x1a1a1a,
            antialias: true
        });

        this.container.appendChild(this.app.view as HTMLCanvasElement);
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            this.handleResize(window.innerWidth, window.innerHeight);
        });
    }

    public handleResize(width: number, height: number): void {
        if (this.app) {
            this.app.renderer.resize(width, height);
        }
    }

    public destroy(): void {
        this.app?.destroy();
        this.app = null;
    }
} 