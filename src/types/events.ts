import { IClip } from './clip';
import { IFloatingWindow } from './window';

export interface EventPayload {
    // Track events
    'track:dragstart': { trackId: string; y: number };
    'track:drag': { trackId: string; y: number };
    'track:dragend': { trackId: string; y: number };
    
    // Window events
    'window:created': { id: string };
    'window:destroyed': { id: string };
    'window:added': { id: string };
    'window:removed': { id: string };
    'window:focused': { id: string };
    
    // Drag events
    'drag:start': { id: string; x: number; y: number };
    'drag:move': { id: string; x: number; y: number };
    'drag:end': { id: string; x: number; y: number };
    
    // Resize events
    'resize:start': { id: string; width: number; height: number };
    'resize:move': { window: any; size: { width: number; height: number } };
    'resize:end': { id: string; width: number; height: number };
    
    // PIXI events
    'pixi:resized': { width: number; height: number };
    'pixi:ready': { app: any };
    'pixi:resize': { width: number; height: number };
    
    // DAW events
    'daw:track:dragstart': { trackId: string; index: number };
    'daw:track:drag': { trackId: string; y: number };
    'daw:track:dragend': { trackId: string; finalY: number };
    'daw:track:reordered': { trackId: string; newIndex: number; order: string[] };
    'daw:clip:added': { clip: IClip };
    'daw:clip:moved': { clip: IClip };
    'daw:clip:resized': { clip: IClip };
    'daw:clip:removed': { clipId: string };
    
    // Window events
    'window:resize': { width: number; height: number };
    'window:move': { x: number; y: number };
    
    // New DAW events
    'daw:transport': {
        action: 'play' | 'stop' | 'pause';
    };
    'daw:playstate': {
        isPlaying: boolean;
    };
    'playhead:move': {
        time: number;
    };
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