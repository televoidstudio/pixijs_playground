import { EventManager } from './EventManager';
import { IFloatingWindow } from '../types/IFloatingWindow';

// Singleton manager for handling multiple windows
export class WindowManager {
    private static instance: WindowManager;
    private windows: Map<string, IFloatingWindow>;
    private eventManager: EventManager;

    private constructor() {
        this.windows = new Map();
        this.eventManager = EventManager.getInstance();
        this.setupEventListeners();
    }

    // Get singleton instance
    public static getInstance(): WindowManager {
        if (!WindowManager.instance) {
            WindowManager.instance = new WindowManager();
        }
        return WindowManager.instance;
    }

    // Register a new window
    public addWindow(window: IFloatingWindow): void {
        this.windows.set(window.id, window);
        this.eventManager.emit('window:added', { id: window.id });
    }

    // Remove a window
    public removeWindow(id: string): void {
        const window = this.windows.get(id);
        if (window) {
            window.destroy();
            this.windows.delete(id);
            this.eventManager.emit('window:removed', { id });
        }
    }

    // Bring a window to front
    public bringToFront(id: string): void {
        const window = this.windows.get(id);
        if (window) {
            window.bringToFront();
            this.eventManager.emit('window:focused', { id });
        }
    }

    // Get all window IDs
    public getWindowIds(): string[] {
        return Array.from(this.windows.keys());
    }

    // Get window count
    public getWindowCount(): number {
        return this.windows.size;
    }

    private setupEventListeners(): void {
        this.eventManager.on('window:destroyed', ({ id }) => {
            this.windows.delete(id);
        });
    }
} 