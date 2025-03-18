import * as PIXI from "pixi.js";
import { EventManager } from "../../utils/EventManager";

export class PixiManager {
    private destroyed = false;
    public app: PIXI.Application | null = null;
    private eventManager: EventManager;

    constructor(private container: HTMLDivElement) {
        this.eventManager = EventManager.getInstance();
    }

    async init() {
        if (this.app) {
            console.warn("🚨 PixiManager 已初始化，跳過 init()");
            return;
        }

        console.log("🎨 初始化 Pixi.js 應用");

        this.app = new PIXI.Application();
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1a1a1a,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        if (this.container.childNodes.length === 0) {
            this.container.appendChild(this.app.canvas);
        }

        this.eventManager.emit('pixi:initialized');
        console.log("✅ Pixi App Initialized");
    }

    handleResize(width: number, height: number) {
        if (this.app) {
            this.app.renderer.resize(width, height);
            this.app.canvas.style.width = `${width}px`;
            this.app.canvas.style.height = `${height}px`;
            this.eventManager.emit('pixi:resized', { width, height });
        }
    }

    destroy() {
        if (!this.app || this.destroyed) {
            console.warn("🚨 PixiManager 已銷毀或未初始化，跳過 destroy()");
            return;
        }
        this.destroyed = true;

        console.log("🧹 銷毀 Pixi.js 應用");
        this.app.destroy(true);
        this.app = null;
        this.eventManager.emit('pixi:destroyed');
    }
} 