import { DAWConstants } from '../../../config/constants';
import { EventManager } from '../../../events/EventManager';
import { AudioEngine } from '../audio/AudioEngine';
import { Timeline } from '../timeline/Timeline';
import { TrackList } from '../track/TrackList';
import { TransportControls } from '../transport/TransportControls';

export class DAWManager {
    private eventManager: EventManager;
    private audioEngine: AudioEngine;
    private timeline: Timeline;
    private trackList: TrackList;
    private transportControls: TransportControls;

    constructor(private app: PIXI.Application) {
        this.eventManager = EventManager.getInstance();
        this.audioEngine = new AudioEngine();
        
        this.initializeComponents();
        this.setupEventListeners();
    }

    private initializeComponents(): void {
        this.timeline = new Timeline(this.app);
        this.trackList = new TrackList(this.app);
        this.transportControls = new TransportControls();
        
        // 設置組件層級
        this.app.stage.sortableChildren = true;
        this.setComponentLayers();
    }

    private setComponentLayers(): void {
        const layers = {
            background: 0,
            tracks: 1,
            timeline: 2,
            playhead: 3,
            transport: 4
        };

        this.trackList.setZIndex(layers.tracks);
        this.timeline.setZIndex(layers.timeline);
        this.transportControls.setZIndex(layers.transport);
    }

    private setupEventListeners(): void {
        // Transport Events
        this.eventManager.on('transport:play', () => {
            this.audioEngine.play();
            this.startPlayback();
        });

        // Track Events
        this.eventManager.on('track:add', (data) => {
            this.trackList.addTrack(data);
        });

        // Timeline Events
        this.eventManager.on('timeline:zoom', (data) => {
            this.timeline.setZoom(data.level);
        });
    }

    public destroy(): void {
        this.audioEngine.destroy();
        this.timeline.destroy();
        this.trackList.destroy();
        this.transportControls.destroy();
    }
} 