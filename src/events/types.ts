import { IClip, ITrack } from '../types/daw';

export type DAWEventType = 
    | TransportEvents
    | TrackEvents
    | TimelineEvents
    | ClipEvents;

export interface TransportEvents {
    'transport:play': void;
    'transport:pause': void;
    'transport:stop': void;
    'transport:seek': { position: number };
    'transport:bpm': { value: number };
}

export interface TrackEvents {
    'track:add': { track: ITrack };
    'track:remove': { id: string };
    'track:move': { id: string; newIndex: number };
    'track:update': { id: string; changes: Partial<ITrack> };
}

export interface TimelineEvents {
    'timeline:zoom': { level: number };
    'timeline:scroll': { position: number };
    'playhead:move': { position: number };
}

export interface ClipEvents {
    'clip:add': { clip: IClip };
    'clip:remove': { id: string };
    'clip:move': { id: string; newPosition: number };
    'clip:resize': { id: string; newDuration: number };
} 