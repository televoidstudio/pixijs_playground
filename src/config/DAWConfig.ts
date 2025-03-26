export interface DAWConfig {
    width: number;
    height: number;
    dimensions: {
        topBarHeight: number;
        timelineHeight: number;
        trackHeight: number;
        controlsWidth: number;
        gridSize: number;
    };
}

/**
 * DAW 默認配置
 */
export const defaultDAWConfig: DAWConfig = {
    width: 1200,
    height: 800,
    dimensions: {
        topBarHeight: 60,
        timelineHeight: 100,
        trackHeight: 80,
        controlsWidth: 200,
        gridSize: 20
    },
    // 視覺相關
    trackHeight: 100,
    timelineHeight: 40,
    controlsWidth: 200,
    
    // 網格相關
    gridColor: 0x333333,
    
    // 音頻相關
    sampleRate: 44100,
    channels: 2,
    
    // 播放相關
    bpm: 120,
    timeSignature: {
        numerator: 4,
        denominator: 4
    }
};

export const DAWConfig = {
    dimensions: {
        topBarHeight: 40,
        trackHeight: 80,
        timelineHeight: 40,
        gridSize: 50,
        playheadWidth: 2,
        controlsWidth: 200
    },
    transport: {
        defaultBPM: 120,
        beatsPerBar: 4,
        secondsPerMinute: 60,
        gridsPerBeat: 1
    },
    colors: {
        background: 0x1a1a1a,
        grid: 0x2d2d2d,
        playhead: 0xff3333,
        trackBackground: 0x2d2d2d,
        buttonBackground: 0x3a3a3a
    }
} as const; 