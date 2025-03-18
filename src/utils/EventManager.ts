// Define event payload types
export interface EventPayload {
    'window:destroyed': { id: string };
    'window:added': { id: string };
    'window:removed': { id: string };
    'window:focused': { id: string };
    'resize:move': { window: IFloatingWindow; size: IWindowSize };
}

// Improve type safety for event callbacks
export type EventCallback<K extends keyof EventPayload> = (data: EventPayload[K]) => void;

// Event management system
export class EventManager {
    private static instance: EventManager;
    private events: Map<string, Set<EventCallback<any>>>;

    private constructor() {
        this.events = new Map();
    }

    // Get singleton instance
    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    // Subscribe to an event
    public on<K extends keyof EventPayload>(event: K, callback: EventCallback<K>): void {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event)?.add(callback);
    }

    // Unsubscribe from an event
    public off<T>(event: string, callback: EventCallback<T>): void {
        this.events.get(event)?.delete(callback);
    }

    // Emit an event
    public emit<K extends keyof EventPayload>(event: K, data: EventPayload[K]): void {
        this.events.get(event)?.forEach(callback => callback(data));
    }

    // Clear all event listeners
    public clear(): void {
        this.events.clear();
    }
} 