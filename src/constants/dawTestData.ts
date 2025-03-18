import { ITrack, IClip } from '../types/daw';

export const testTracks: ITrack[] = [
    {
        id: '1',
        name: '音軌 1',
        volume: 1,
        isMuted: false,
        isSolo: false,
        color: 0x3a3a3a
    },
    {
        id: '2',
        name: '音軌 2',
        volume: 1,
        isMuted: false,
        isSolo: false,
        color: 0x4a4a4a
    },
    {
        id: '3',
        name: '音軌 3',
        volume: 1,
        isMuted: false,
        isSolo: false,
        color: 0x5a5a5a
    }
];

export const testClips: IClip[] = [
    {
        id: '1',
        trackId: '1',
        startTime: 0,
        duration: 4,
        color: 0x4488ff,
        name: '片段 1'
    },
    {
        id: '2',
        trackId: '2',
        startTime: 2,
        duration: 6,
        color: 0xff8844,
        name: '片段 2'
    },
    {
        id: '3',
        trackId: '3',
        startTime: 4,
        duration: 3,
        color: 0x44ff88,
        name: '片段 3'
    }
]; 