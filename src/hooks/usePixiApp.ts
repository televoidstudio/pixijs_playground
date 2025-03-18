import { useEffect, useRef } from 'react';
import { PixiManager } from '../core/managers/PixiManager';
import { WindowManager } from '../core/managers/WindowManager';

// Custom hook for managing PIXI application
export function usePixiApp() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiManagerRef = useRef<PixiManager | null>(null);
    const windowManagerRef = useRef<WindowManager>(WindowManager.getInstance());

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const initPixiApp = async () => {
            if (!pixiManagerRef.current) {
                pixiManagerRef.current = new PixiManager(container);
                await pixiManagerRef.current.init();
            }
        };

        initPixiApp().catch(console.error);

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