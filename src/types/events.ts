import { IClip, ITrack } from './daw';

export interface DAWEventPayload {
    // Pixi 相關事件
    'pixi:initialized': void;
    'pixi:resized': { width: number; height: number };
    'pixi:destroyed': void;

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
    'daw:transport:play': void;
    'daw:transport:pause': void;
    'daw:transport:stop': void;
    'daw:transport:seek': { position: number };
    'daw:track:add': { track: ITrack };
    'daw:track:added': { track: ITrack };
    'daw:track:move': { trackId: string; newIndex: number };
    'daw:playhead:move': void;
    'daw:track:contextmenu': { trackId: string; x: number; y: number };
    'daw:clip:contextmenu': { clipId: string; x: number; y: number };
    
    // 音頻測試事件
    'daw:audio:test': { type: 'note' | 'chord' | 'scale' };
    'daw:audio:preview': { note: string };
    'daw:tool:changed': { tool: string };
    
    // MIDI 編輯器事件
    'daw:midi:note:added': { note: { pitch: number; time: number; duration: number; velocity: number } };
    'daw:midi:note:removed': { note: { pitch: number; time: number; duration: number; velocity: number } };
    'daw:midi:note:moved': { note: { pitch: number; time: number; duration: number; velocity: number } };
    'daw:midi:note:resized': { note: { pitch: number; time: number; duration: number; velocity: number } };
    
    // 視窗管理事件
    'daw:window:add': { window: any; zIndex: number };
    'daw:window:remove': { window: any };
    
    // Clip 相關事件
    'clip:added': { clip: IClip };
    'clip:moved': { clip: IClip };
    'clip:resized': { clip: IClip };
    'clip:removed': { clipId: string };
    'clip:cut': { clipId: string };
    'clip:copy': { clipId: string };
    'clip:delete': { clipId: string };
    'clip:split': { clipId: string };
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

export interface DAWEventMap {
    // 傳輸控制事件
    'daw:transport:play': void;
    'daw:transport:pause': void;
    'daw:transport:stop': void;
    'daw:transport:seek': { position: number };
    
    // 軌道事件
    'daw:track:add': { track: ITrack };
    'daw:track:remove': { trackId: string };
    'daw:track:move': { trackId: string; newIndex: number };
    'daw:track:update': { track: ITrack };
    'daw:track:contextmenu': { trackId: string; x: number; y: number };
    'daw:track:removed': { trackId: string };
    
    // 片段事件
    'daw:clip:add': { clip: IClip };
    'daw:clip:remove': { clipId: string };
    'daw:clip:move': { clip: IClip };
    'daw:clip:resize': { clip: IClip };
    'daw:clip:contextmenu': { clipId: string; x: number; y: number };
    'daw:clip:removed': { clipId: string };
    
    // 播放頭事件
    'daw:playhead:move': void;
    'daw:playhead:position': { position: number };
    
    // BPM 事件
    'daw:bpm:change': { bpm: number };
} 