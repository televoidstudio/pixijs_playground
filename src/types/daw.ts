export interface ITrack {
    id: string;
    name: string;
    volume: number;
    isMuted: boolean;
    isSolo: boolean;
    color: number;
}

export interface ITimeline {
    position: number;    // 當前位置（秒）
    zoom: number;       // 縮放級別
    gridSize: number;   // 網格大小
    isPlaying: boolean; // 播放狀態
    bpm: number;       // 每分鐘節拍數
}

export interface IClip {
    id: string;
    trackId: string;
    startTime: number;  // 開始時間（以拍子為單位）
    duration: number;   // 持續時間（以拍子為單位）
    color: number;      // 顏色
    name: string;       // 片段名稱
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