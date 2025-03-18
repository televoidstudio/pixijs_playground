import * as PIXI from 'pixi.js';

// Interface for the PIXI application manager
export interface IPixiManager {
    // The PIXI application instance
    app: PIXI.Application | null;
    
    // Initialize the PIXI application
    init(): Promise<void>;
    
    // Clean up resources
    destroy(): void;
    
    // Handle window resize events
    handleResize(width: number, height: number): void;
} 