import { useEffect, useRef, useMemo } from 'react';
import { PixiManager } from '../components/pixi/PixiManager';
import { WindowManager } from '../utils/WindowManager';
import { FPSMonitor } from '../utils/FPSMonitor';

// Custom hook for managing PIXI application
export function usePixiApp() {
    const containerRef = useRef<HTMLDivElement>(null);
    const pixiManagerRef = useRef<PixiManager | null>(null);
    const windowManagerRef = useRef<WindowManager>(WindowManager.getInstance());

    useEffect(() => {
        // Guard clause for container ref
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Initialize PIXI application
        const initPixiApp = async () => {
            if (!pixiManagerRef.current) {
                pixiManagerRef.current = new PixiManager(container);
                await pixiManagerRef.current.init();
            }
        };

        initPixiApp().catch(console.error);

        // Cleanup on unmount
        return () => {
            pixiManagerRef.current?.destroy();
            pixiManagerRef.current = null;
        };
    }, []);

    // 加入效能監控
    useEffect(() => {
        const fpsMonitor = new FPSMonitor();
        return () => fpsMonitor.destroy();
    }, []);

    // 使用 useMemo 優化物件建立
    const api = useMemo(() => ({
        containerRef,
        pixiManagerRef,
        windowManager: windowManagerRef.current
    }), []);

    return api;
} 