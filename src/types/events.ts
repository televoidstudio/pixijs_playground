import { ITrack, IClip } from "./daw";

/**
 * UI 事件載荷定義
 */
export interface UIEventPayload {
    // 軌道相關事件
    'ui:track:dragstart': { trackId: string; y: number };
    'ui:track:drag': { trackId: string; y: number };
    'ui:track:dragend': { trackId: string; y: number };
    'ui:track:contextmenu': { trackId: string; x: number; y: number };
    'ui:track:rename:start': { trackId: string; currentName: string };
    'ui:track:rename': { trackId: string; name: string };
    'ui:track:reorder': { trackId: string; newIndex: number };

    // 片段相關事件
    'ui:clip:dragstart': { clipId: string; x: number };
    'ui:clip:drag': { clipId: string; x: number };
    'ui:clip:dragend': { clipId: string; x: number };
    'ui:clip:resize': { clipId: string; width: number };
    'ui:clip:contextmenu': { clipId: string; x: number; y: number };
    
    // 時間軸相關事件
    'ui:timeline:scroll': { scrollX: number };
    'ui:timeline:zoom': { zoomLevel: number };
    'ui:timeline:click': { time: number };
    'ui:timeline:playhead:dragstart': { position: number };
    'ui:timeline:playhead:drag': { position: number };
    'ui:timeline:playhead:dragend': { position: number };
    'ui:timeline:playhead:move': { position: number };
    
    // 傳輸控制相關事件
    'ui:transport:playback:toggle': { isPlaying: boolean };
    'ui:transport:playback:stop': {};
    'ui:transport:time:update': { time: number };
    'ui:transport:bpm:update': { bpm: number };
}

/**
 * Domain 事件載荷定義
 */
export interface DomainEventPayload {
    // 軌道相關事件
    'domain:track:reordered': { trackId: string; newIndex: number };
    'domain:track:added': { track: ITrack };
    'domain:track:removed': { trackId: string };
    'domain:track:renamed': { trackId: string; name: string };
    
    // 片段相關事件
    'domain:clip:moved': { clipId: string; newStartTime: number };
    'domain:clip:resized': { clipId: string; newDuration: number };
    'domain:clip:added': { clip: IClip };
    'domain:clip:removed': { clipId: string };
    
    // 音頻相關事件
    'domain:audio:playback:started': void;
    'domain:audio:playback:stopped': void;
    'domain:audio:playback:paused': void;

    // Timeline 相關事件
    'domain:timeline:time:changed': { time: number };
    'domain:timeline:zoom:changed': { zoomLevel: number };
    'domain:timeline:playhead:position:changed': { position: number };
} 