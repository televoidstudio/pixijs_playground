import * as PIXI from "pixi.js";

/**
 * PixiManager - 負責建立和銷毀 PixiJS Application
 */
export class PixiManager {
    private destroyed = false; // 🚩 用來避免重複銷毀
    public app: PIXI.Application | null = null;

    constructor(private container: HTMLDivElement) {
        // 可在這裡做一些預設屬性設定
    }

    /**
     * 初始化 PixiJS，並將 Canvas 掛載到 container
     */
    async init() {
        // 若已經初始化，就跳過
        if (this.app) {
            console.warn("🚨 PixiManager 已初始化，跳過 init()");
            return;
        }

        console.log("🎨 初始化 Pixi.js 應用");

        // 建立 Application
        this.app = new PIXI.Application();

        // PixiJS v7 的 init，讓你指定渲染參數
        await this.app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1a1a1a,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        // 將 Canvas 加入到 container
        if (this.container.childNodes.length === 0) {
            this.container.appendChild(this.app.canvas);
        }

        // 你也可以在這裡做更多操作，如載入資源、建立場景等
        console.log("✅ Pixi App Initialized");
    }

    /**
     * 銷毀 PixiJS Application
     */
    destroy() {
        if (!this.app || this.destroyed) {
            console.warn("🚨 PixiManager 已銷毀或未初始化，跳過 destroy()");
            return;
        }
        this.destroyed = true;

        console.log("🧹 銷毀 Pixi.js 應用");
        // 若 destroy(true) 報錯，可改成 destroy(false)
        this.app.destroy(true);
        this.app = null;
    }
}