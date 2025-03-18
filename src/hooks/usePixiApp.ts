import { useEffect, useRef } from 'react';
import { PixiManager } from '../components/pixi/PixiManager';
import { WindowManager } from '../utils/WindowManager';

// Custom hook for managing PIXI application
export function usePixiApp() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiManagerRef = useRef<PixiManager | null>(null);
    const windowManagerRef = useRef<WindowManager>(WindowManager.getInstance());

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize PIXI application
        const initPixiApp = async () => {
            if (!pixiManagerRef.current) {
                pixiManagerRef.current = new PixiManager(containerRef.current);
                await pixiManagerRef.current.init();
            }
        };

        initPixiApp();

        // Cleanup on unmount
        return () => {
            pixiManagerRef.current?.destroy();
            pixiManagerRef.current = null;
        };
    }, []);

    return {
        containerRef,
        pixiManagerRef,
        windowManager: windowManagerRef.current
    };
} 