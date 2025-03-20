export interface DAWEventMap {
    // Transport Events
    'transport:play': void;
    'transport:pause': void;
    'transport:stop': void;
    'transport:seek': { position: number };
    
    // Track Events
    'track:add': { id: string; name: string };
    'track:remove': { id: string };
    'track:move': { id: string; newIndex: number };
    'track:update': { id: string; changes: Partial<Track> };
    
    // Timeline Events
    'timeline:zoom': { level: number };
    'timeline:scroll': { position: number };
    
    // Clip Events
    'clip:add': { clip: IClip };
    'clip:remove': { id: string };
    'clip:move': { id: string; newPosition: number };
    'clip:resize': { id: string; newDuration: number };
} 