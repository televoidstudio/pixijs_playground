import { EventEmitter } from "events";
import { UIEventPayload } from "../types/events";

export class UIEventBus {
    private static instance: UIEventBus;
    private eventEmitter: EventEmitter;

    private constructor() {
        this.eventEmitter = new EventEmitter();
        // 設置最大監聽器數量
        this.eventEmitter.setMaxListeners(100);
    }

    public static getInstance(): UIEventBus {
        if (!UIEventBus.instance) {
            UIEventBus.instance = new UIEventBus();
        }
        return UIEventBus.instance;
    }

    public emit<K extends keyof UIEventPayload>(
        event: K,
        payload: UIEventPayload[K]
    ): void {
        this.eventEmitter.emit(event as string, payload);
    }

    public on<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.eventEmitter.on(event as string, handler);
    }

    public off<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.eventEmitter.off(event as string, handler);
    }

    public removeAllListeners(): void {
        this.eventEmitter.removeAllListeners();
    }
} 