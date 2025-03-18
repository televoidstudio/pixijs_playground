// Type definition for event callbacks
export type EventCallback<T = any> = (data: T) => void;

// Event management system
export class EventManager {
    private static instance: EventManager;
    private events: Map<string, Set<EventCallback>>;

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
    public on<T>(event: string, callback: EventCallback<T>): void {
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
    public emit<T>(event: string, data: T): void {
        this.events.get(event)?.forEach(callback => callback(data));
    }

    // Clear all event listeners
    public clear(): void {
        this.events.clear();
    }
} 