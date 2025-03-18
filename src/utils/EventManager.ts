type EventCallback = (...args: any[]) => void;

export class EventManager {
  private static instance: EventManager;
  private events: Map<string, EventCallback[]>;

  private constructor() {
    this.events = new Map();
  }

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(callback);
  }

  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach(callback => callback(...args));
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
} 