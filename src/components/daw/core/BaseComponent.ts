import * as PIXI from "pixi.js";
import { EventManager } from "../../../events/EventManager";

/**
 * DAW 組件的基礎抽象類
 * 提供所有 DAW 組件的共同功能和結構
 */
export abstract class BaseComponent {
    /**
     * PIXI 容器實例
     * 用於管理和渲染組件的視覺元素
     */
    protected container: PIXI.Container;

    /**
     * 事件管理器實例
     * 用於處理組件間的事件通信
     */
    protected eventManager: EventManager;

    /**
     * 構造函數
     * 初始化基礎組件所需的容器和事件管理器
     */
    constructor() {
        // 創建新的 PIXI 容器
        this.container = new PIXI.Container();
        // 獲取事件管理器單例
        this.eventManager = EventManager.getInstance();
    }

    /**
     * 獲取組件的 PIXI 容器
     * @returns PIXI.Container 實例
     */
    public getContainer(): PIXI.Container {
        return this.container;
    }

    /**
     * 更新組件狀態的抽象方法
     * 子類必須實現此方法以更新其視覺狀態
     * @param args - 更新所需的參數
     */
    public abstract update(...args: any[]): void;

    /**
     * 清理組件資源的抽象方法
     * 子類必須實現此方法以正確清理資源
     */
    public abstract destroy(): void;

    public setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    public setZIndex(index: number): void {
        this.container.zIndex = index;
    }
} 