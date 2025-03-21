import { IClip } from './clip';
import { ITrack } from './track';

export interface DAWEventPayload {
    // Track 基礎事件
    'track:dragstart': { trackId: string; y: number };
    'track:drag': { trackId: string; y: number };
    'track:dragend': { trackId: string; y: number };
    'track:rename': { trackId: string; name: string };
    'track:added': { track: ITrack };
    'track:removed': { trackId: string };
    'track:updated': { track: ITrack };
    
    // DAW 業務事件
    'daw:track:reorder': { trackId: string; newIndex: number };
    'daw:track:preview': { trackId: string; currentIndex: number; targetIndex: number };
    'daw:transport': { action: 'play' | 'pause' | 'stop' };
    'daw:playhead': { position: number };
    'daw:bpm:change': { bpm: number };
    
    // Clip 相關事件
    'clip:added': { clip: IClip };
    'clip:moved': { clip: IClip };
    'clip:resized': { clip: IClip };
    'clip:removed': { clipId: string };
}

export type DAWEventType = keyof DAWEventPayload;

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