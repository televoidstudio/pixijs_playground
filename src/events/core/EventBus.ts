import { EventEmitter } from 'events';

/**
 * 基礎事件總線類
 * 提供事件處理的基本功能
 */
export abstract class EventBus<T extends Record<string, any>> {
    protected eventEmitter: EventEmitter;

    protected constructor() {
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(50);
    }

    /**
     * 發送事件
     * @param event 事件名稱
     * @param payload 事件數據
     */
    public emit<K extends keyof T>(event: K, payload: T[K]): void {
        this.eventEmitter.emit(event as string, payload);
    }

    /**
     * 監聽事件
     * @param event 事件名稱
     * @param handler 事件處理函數
     */
    public on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
        this.eventEmitter.on(event as string, handler);
    }

    /**
     * 取消事件監聽
     * @param event 事件名稱
     * @param handler 事件處理函數
     */
    public off<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
        this.eventEmitter.off(event as string, handler);
    }

    /**
     * 監聽一次性事件
     * @param event 事件名稱
     * @param handler 事件處理函數
     */
    public once<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
        this.eventEmitter.once(event as string, handler);
    }

    /**
     * 移除所有事件監聽器
     * @param event 事件名稱（可選）
     */
    public removeAllListeners<K extends keyof T>(event?: K): void {
        if (event) {
            this.eventEmitter.removeAllListeners(event as string);
        } else {
            this.eventEmitter.removeAllListeners();
        }
    }
} 