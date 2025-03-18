import { useCallback } from 'react';
import { WindowManager } from '../utils/managers/WindowManager';
import { IFloatingWindow } from '../types/window';

export function useWindowManager() {
    const windowManager = WindowManager.getInstance();

    const createWindow = useCallback((app: PIXI.Application) => {
        const window = new FloatingWindow(app);
        windowManager.addWindow(window);
        return window;
    }, []);

    const closeWindow = useCallback((id: string) => {
        windowManager.removeWindow(id);
    }, []);

    return {
        windowManager,
        createWindow,
        closeWindow
    };
} 