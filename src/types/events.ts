import { IFloatingWindow, IWindowSize } from './window';

export interface EventPayload {
    'window:destroyed': { id: string };
    'window:added': { id: string };
    'window:removed': { id: string };
    'window:focused': { id: string };
    'resize:move': { window: IFloatingWindow; size: IWindowSize };
}

// 使用常數來定義事件名稱
export const EVENTS = {
    WINDOW: {
        DESTROYED: 'window:destroyed' as const,
        ADDED: 'window:added' as const,
        REMOVED: 'window:removed' as const,
        FOCUSED: 'window:focused' as const,
    },
    RESIZE: {
        MOVE: 'resize:move' as const
    }
} as const; 