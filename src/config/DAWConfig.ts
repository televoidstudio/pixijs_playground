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