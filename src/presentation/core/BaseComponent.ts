import * as PIXI from "pixi.js";
import { UIEventBus } from "../../events/UIEventBus";
import { DomainEventBus } from "../../events/DomainEventBus";
import { UIEventPayload } from "../../types/events";

/**
 * 表現層基礎組件
 * 提供所有 UI 組件的共同功能和結構
 */
export abstract class BaseComponent {
    /**
     * PIXI 容器實例，用於管理和渲染組件的視覺元素
     */
    protected container: PIXI.Container;

    /**
     * 組件唯一標識符
     */
    private readonly id: string;

    /**
     * 事件總線實例，用於處理 UI 和領域事件
     */
    protected readonly uiEventBus: UIEventBus;
    protected readonly domainEventBus: DomainEventBus;

    /**
     * 構造函數
     * @param id 組件唯一標識符
     */
    constructor(id: string) {
        this.id = id;
        this.uiEventBus = UIEventBus.getInstance();
        this.domainEventBus = DomainEventBus.getInstance();

        // 初始化 PIXI 容器
        this.container = new PIXI.Container();
        this.container.name = id; // 用於調試
        this.container.sortableChildren = true;
        this.container.eventMode = 'static';
        this.container.visible = true;
    }

    /**
     * 初始化組件
     */
    public abstract initialize(): void;

    /**
     * 初始化組件的抽象方法
     * 子類必須實現此方法以設置其視覺元素
     */
    protected abstract setupComponent(): void;

    /**
     * 設置事件處理器的抽象方法
     * 子類必須實現此方法以處理組件的事件
     */
    protected abstract setupEventHandlers(): void;

    /**
     * 更新組件狀態的抽象方法
     * 子類必須實現此方法以更新其視覺狀態
     */
    public abstract update(): void;

    /**
     * 獲取組件的唯一標識符
     */
    public getId(): string {
        return this.id;
    }

    /**
     * 獲取組件的 PIXI 容器
     */
    public getContainer(): PIXI.Container {
        return this.container;
    }

    /**
     * 設置組件位置
     */
    public setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    /**
     * 設置組件的 Z 軸層級
     */
    public setZIndex(zIndex: number): void {
        this.container.zIndex = zIndex;
    }

    /**
     * 設置組件可見性
     */
    public setVisible(visible: boolean): void {
        this.container.visible = visible;
    }

    /**
     * 發送 UI 事件
     */
    protected emitUIEvent<K extends keyof UIEventPayload>(
        event: K,
        payload: UIEventPayload[K]
    ): void {
        this.uiEventBus.emit(event, { ...payload, componentId: this.id });
    }

    /**
     * 監聽 UI 事件
     */
    protected onUIEvent<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.uiEventBus.on(event, handler);
    }

    /**
     * 移除 UI 事件監聽器
     */
    protected offUIEvent<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.uiEventBus.off(event, handler);
    }

    /**
     * 銷毀組件
     */
    public destroy(): void {
        this.uiEventBus.removeAllListeners();
        this.container.destroy({ children: true });
    }
} 