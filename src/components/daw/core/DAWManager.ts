import { DAWConfig } from '../../../config/DAWConfig';
import { EventManager } from '../../../events/EventManager';
import { Timeline } from '../timeline/Timeline';
import { TrackList } from '../track/TrackList';
import { TopBar } from '../transport/TopBar';
import { Playhead } from '../timeline/Playhead';
import { ITimeline } from '../../../types/daw';

export class DAWManager {
    private eventManager: EventManager;
    private timeline: Timeline;
    private trackList: TrackList;
    private topBar: TopBar;
    private playhead: Playhead;
    
    private timelineState: ITimeline;
    private isPlaying: boolean = false;
    private lastTimestamp: number = 0;
    private animationFrameId: number | null = null;

    constructor(private app: PIXI.Application) {
        this.eventManager = EventManager.getInstance();
        this.initializeState();
        this.initializeComponents();
        this.setupEventListeners();
    }

    private initializeState(): void {
        this.timelineState = {
            position: 0,
            zoom: 1,
            gridSize: DAWConfig.dimensions.gridSize,
            isPlaying: false,
            bpm: DAWConfig.transport.defaultBPM
        };
    }

    private initializeComponents(): void {
        // 設置舞台排序
        this.app.stage.sortableChildren = true;

        // 初始化組件
        this.topBar = new TopBar(this.app.screen.width);
        this.timeline = new Timeline(this.app, this.timelineState);
        this.trackList = new TrackList(this.app);
        this.playhead = new Playhead(
            this.app.screen.height - DAWConfig.dimensions.topBarHeight,
            this.timelineState.gridSize
        );

        // 設置位置
        this.setupComponentPositions();
        
        // 設置層級
        this.setupComponentLayers();
        
        // 添加到舞台
        this.addComponentsToStage();
    }

    private setupComponentPositions(): void {
        const { topBarHeight } = DAWConfig.dimensions;
        
        this.trackList.setPosition(0, topBarHeight);
        this.timeline.setPosition(0, topBarHeight);
        this.playhead.setPosition(0, topBarHeight);
    }

    private setupComponentLayers(): void {
        const layers = {
            background: 0,
            tracks: 1,
            timeline: 2,
            playhead: 3,
            topBar: 4
        };

        this.trackList.setZIndex(layers.tracks);
        this.timeline.setZIndex(layers.timeline);
        this.playhead.setZIndex(layers.playhead);
        this.topBar.setZIndex(layers.topBar);
    }

    private addComponentsToStage(): void {
        this.app.stage.addChild(
            this.trackList.getContainer(),
            this.timeline.getContainer(),
            this.playhead.getContainer(),
            this.topBar.getContainer()
        );
    }

    private setupEventListeners(): void {
        this.setupTransportEvents();
        this.setupTrackEvents();
        this.setupPlayheadEvents();
    }

    private setupTransportEvents(): void {
        this.eventManager.on('transport:play', () => this.play());
        this.eventManager.on('transport:pause', () => this.pause());
        this.eventManager.on('transport:stop', () => this.stop());
        this.eventManager.on('transport:seek', (data) => this.seek(data.position));
    }

    private setupTrackEvents(): void {
        this.eventManager.on('track:add', (data) => {
            this.trackList.addTrack(data);
        });

        this.eventManager.on('track:move', (data) => {
            this.trackList.moveTrack(data.id, data.newIndex);
        });
    }

    private setupPlayheadEvents(): void {
        this.eventManager.on('playhead:move', () => {
            this.updateTimeFromPlayhead();
        });
    }

    private play(): void {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.lastTimestamp = performance.now();
        this.animate();
    }

    private pause(): void {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    private stop(): void {
        this.isPlaying = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.playhead.setPosition(0);
        this.updateTimeFromPlayhead();
    }

    private seek(position: number): void {
        this.playhead.setPosition(position);
        this.updateTimeFromPlayhead();
    }

    private updateTimeFromPlayhead(): void {
        const position = this.playhead.getPosition();
        this.topBar.setBeat(position);
    }

    private animate = () => {
        if (!this.isPlaying) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTimestamp) / 1000;
        this.lastTimestamp = currentTime;

        const beatsPerSecond = this.timelineState.bpm / DAWConfig.transport.secondsPerMinute;
        const beatDelta = deltaTime * beatsPerSecond;

        const currentPosition = this.playhead.getPosition();
        const newPosition = currentPosition + beatDelta;
        
        this.playhead.setPosition(newPosition);
        this.updateTimeFromPlayhead();

        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    public destroy(): void {
        this.timeline.destroy();
        this.trackList.destroy();
        this.topBar.destroy();
        this.playhead.destroy();
    }
} 