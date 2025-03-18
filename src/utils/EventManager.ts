// Define event payload types
import { DAWEventPayload } from '../types/daw';
import * as PIXI from 'pixi.js';
// 假設 IClip 在 daw 裡面
import { IClip } from '../types/daw';

export interface EventPayload extends DAWEventPayload {
    'window:destroyed': { id: string };
    'window:added': { id: string };
    'window:removed': { id: string };
    'window:focused': { id: string };
    'window:created': { id: string };
    'resize:move': { window: any; size: any };  // 暫時使用 any
    'resize:start': { window: any; position: any };
    'resize:end': { window: any; size: any };
    'drag:start': { target: PIXI.Container };
    'drag:move': { target: PIXI.Container; position: { x: number; y: number } };
    'drag:end': { target: PIXI.Container };
    'pixi:initialized': void;
    'pixi:resized': { width: number; height: number };
    'pixi:destroyed': void;
    'daw:track:dragstart': { trackId: string; index: number };
    'daw:track:drag': { trackId: string; y: number };
    'daw:track:dragend': { trackId: string; finalY: number };
    'daw:track:reordered': { trackId: string; newIndex: number };
    'daw:clip:added': { clip: IClip };
    'daw:clip:moved': { clip: IClip };
    'daw:clip:resized': { clip: IClip };
    'daw:clip:removed': { clipId: string };
}

// Improve type safety for event callbacks
export type EventCallback<K extends keyof EventPayload> = (data: EventPayload[K]) => void;

// Event management system
export class EventManager {
    private static instance: EventManager;
    private listeners: Map<keyof EventPayload, Set<Function>> = new Map();

    private constructor() {}

    // Get singleton instance
    public static getInstance(): EventManager {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    public static emit<T extends keyof EventPayload>(event: T, data: EventPayload[T]): void {
        EventManager.getInstance().emit(event, data);
    }

    // Subscribe to an event
    public on<T extends keyof EventPayload>(event: T, callback: (data: EventPayload[T]) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    // Unsubscribe from an event
    public off<T extends keyof EventPayload>(event: T, callback: (data: EventPayload[T]) => void): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
        }
    }

    // Emit an event
    public emit<T extends keyof EventPayload>(event: T, data: EventPayload[T]): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(listener => listener(data));
        }
    }

    // Clear all event listeners
    public clear(): void {
        this.listeners.clear();
    }
} 