/**
 * 軌道介面定義
 */
export interface ITrack {
    id: string;
    name: string;
    index: number;
    clips: IClip[];
    volume: number;
    pan: number;
    muted: boolean;
    soloed: boolean;
}

/**
 * 音頻片段介面定義
 */
export interface IClip {
    id: string;
    trackId: string;
    startTime: number;
    duration: number;
    audioBuffer: AudioBuffer | null;
    name: string;
    color: number;
}

/**
 * DAW 配置介面定義
 */
export interface DAWConfig {
    // 視覺相關
    trackHeight: number;
    timelineHeight: number;
    controlsWidth: number;
    
    // 網格相關
    gridSize: number;
    gridColor: number;
    
    // 音頻相關
    sampleRate: number;
    channels: number;
    
    // 播放相關
    bpm: number;
    timeSignature: {
        numerator: number;
        denominator: number;
    };
}

export interface ITimeline {
    position: number;    // 當前位置（秒）
    zoom: number;       // 縮放級別
    gridSize: number;   // 網格大小
    isPlaying: boolean; // 播放狀態
    bpm: number;       // 每分鐘節拍數
}

// 擴展 EventPayload
export interface DAWEventPayload {
    'daw:track:added': { track: ITrack };
    'daw:track:removed': { trackId: string };
    'daw:track:updated': { track: ITrack };
    'daw:track:reordered': { trackId: string; newIndex: number };
    'daw:timeline:position': { position: number };
    'daw:timeline:zoom': { zoom: number };
    'daw:playback:start': { position: number };
    'daw:playback:stop': { position: number };
    'daw:playback:position': { position: number };
    'daw:clip:added': { clip: IClip };
    'daw:clip:removed': { clipId: string };
    'daw:clip:moved': { clip: IClip };
    'daw:clip:resized': { clip: IClip };
}

export interface EventPayload {
    'daw:track:dragstart': { trackId: string; index: number };
    'daw:track:drag': { trackId: string; y: number };
    'daw:track:dragend': { trackId: string; finalY: number };
    'daw:track:reordered': { trackId: string; newIndex: number; order: string[] };
    'daw:clip:moved': { clip: IClip };
    'daw:clip:resized': { clip: IClip };
    'daw:clip:added': { clip: IClip };
    'daw:clip:removed': { clipId: string };
} 