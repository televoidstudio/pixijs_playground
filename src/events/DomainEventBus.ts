import { EventEmitter } from "events";
import { DomainEventPayload } from "../types/events";

export class DomainEventBus {
    private static instance: DomainEventBus;
    private eventEmitter: EventEmitter;

    private constructor() {
        this.eventEmitter = new EventEmitter();
        // 設置最大監聽器數量
        this.eventEmitter.setMaxListeners(100);
    }

    public static getInstance(): DomainEventBus {
        if (!DomainEventBus.instance) {
            DomainEventBus.instance = new DomainEventBus();
        }
        return DomainEventBus.instance;
    }

    public emit<K extends keyof DomainEventPayload>(
        event: K,
        payload: DomainEventPayload[K]
    ): void {
        this.eventEmitter.emit(event as string, payload);
    }

    public on<K extends keyof DomainEventPayload>(
        event: K,
        handler: (payload: DomainEventPayload[K]) => void
    ): void {
        this.eventEmitter.on(event as string, handler);
    }

    public off<K extends keyof DomainEventPayload>(
        event: K,
        handler: (payload: DomainEventPayload[K]) => void
    ): void {
        this.eventEmitter.off(event as string, handler);
    }

    public removeAllListeners(): void {
        this.eventEmitter.removeAllListeners();
    }
} 