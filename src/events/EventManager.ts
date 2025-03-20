export class EventManager {
    private static instance: EventManager;
    private listeners: Map<string, Set<Function>>;

    private constructor() {
        this.listeners = new Map();
    }

    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public on<K extends keyof DAWEventMap>(
        event: K,
        callback: (data: DAWEventMap[K]) => void
    ): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);
    }

    public emit<K extends keyof DAWEventMap>(
        event: K,
        data: DAWEventMap[K]
    ): void {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }

    public off<K extends keyof DAWEventMap>(
        event: K,
        callback: (data: DAWEventMap[K]) => void
    ): void {
        this.listeners.get(event)?.delete(callback);
    }
} 