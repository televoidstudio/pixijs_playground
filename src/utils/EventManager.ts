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
    public off<K extends keyof EventPayload>(event: K, callback: EventCallback<K>): void {
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