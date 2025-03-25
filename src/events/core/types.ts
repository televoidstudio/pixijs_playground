import { IClip, ITrack } from '../../types/daw';

/**
 * UI 事件負載類型定義
 */
export interface UIEventPayload {
    // Track 相關事件
    'track:dragstart': { trackId: string; y: number };
    'track:drag': { trackId: string; y: number };
    'track:dragend': { trackId: string; newIndex: number };
    'track:add': { trackId: string; type: string };
    'track:remove': { trackId: string };
    'track:contextmenu': { trackId: string; x: number; y: number };

    // Clip 相關事件
    'clip:dragstart': { clipId: string; trackId: string };
    'clip:drag': { clipId: string; trackId: string; x: number };
    'clip:dragend': { clipId: string; trackId: string; newStartTime: number };
    'clip:resize': { clipId: string; newDuration: number };
    'clip:add': { clipId: string; trackId: string; startTime: number };
    'clip:remove': { clipId: string };

    // Timeline 相關事件
    'timeline:scroll': { x: number; y: number };
    'timeline:zoom': { level: number };

    // 播放控制相關事件
    'playback:play': void;
    'playback:pause': void;
    'playback:stop': void;
}

/**
 * 領域事件負載類型定義
 */
export interface DomainEventPayload {
    // Track 相關事件
    'track:reordered': { trackId: string; newIndex: number };
    'track:added': { trackId: string; type: string };
    'track:removed': { trackId: string };

    // Clip 相關事件
    'clip:moved': { clipId: string; trackId: string; newStartTime: number };
    'clip:resized': { clipId: string; newDuration: number };
    'clip:added': { clipId: string; trackId: string; startTime: number };
    'clip:removed': { clipId: string };

    // 播放控制相關事件
    'playback:started': { timestamp: number };
    'playback:paused': { timestamp: number };
    'playback:stopped': { timestamp: number };
}

/**
 * DAW 事件常量
 */
export const DAW_EVENTS = {
    TRACK: {
        DRAGSTART: 'track:dragstart',
        DRAG: 'track:drag',
        DRAGEND: 'track:dragend',
        ADD: 'track:add',
        REMOVE: 'track:remove',
        REORDERED: 'track:reordered',
        ADDED: 'track:added',
        REMOVED: 'track:removed'
    },
    CLIP: {
        DRAGSTART: 'clip:dragstart',
        DRAG: 'clip:drag',
        DRAGEND: 'clip:dragend',
        RESIZE: 'clip:resize',
        ADD: 'clip:add',
        REMOVE: 'clip:remove',
        MOVED: 'clip:moved',
        RESIZED: 'clip:resized',
        ADDED: 'clip:added',
        REMOVED: 'clip:removed'
    },
    PLAYBACK: {
        PLAY: 'playback:play',
        PAUSE: 'playback:pause',
        STOP: 'playback:stop',
        STARTED: 'playback:started',
        PAUSED: 'playback:paused',
        STOPPED: 'playback:stopped'
    }
} as const; 