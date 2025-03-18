import * as PIXI from "pixi.js";
import { Timeline } from "./components/Timeline";
import { Track } from "./components/Track";
import { ITrack, ITimeline, IClip } from "../../types/daw";
import { EventManager } from "../../utils/EventManager";

export class DAWManager {
    private timeline: Timeline;
    private tracks: Map<string, Track> = new Map();
    private timelineState: ITimeline;
    private trackContainer: PIXI.Container;
    private background: PIXI.Graphics;
    private eventManager: EventManager;

    constructor(private app: PIXI.Application) {
        console.log("DAWManager constructor called");  // 檢查點 1
        this.eventManager = EventManager.getInstance();
        this.trackContainer = new PIXI.Container();
        this.app.stage.addChild(this.trackContainer);
        
        // 初始化時間軸狀態
        this.timelineState = {
            position: 0,
            zoom: 1,
            gridSize: 50,
            isPlaying: false,
            bpm: 120
        };

        // 創建背景
        this.background = new PIXI.Graphics();
        
        // 創建時間軸
        this.timeline = new Timeline(this.app, this.timelineState);
        
        // 初始化
        this.init();
        this.setupTrackEvents();
    }

    private init() {
        console.log("DAWManager init");
        
        // 測試圖形
        const testGraphics = new PIXI.Graphics();
        testGraphics
            .fill({ color: 0xff0000 })
            .rect(100, 100, 100, 100);
        
        this.app.stage.addChild(testGraphics);
        
        // 設置背景
        this.background
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, this.app.screen.width, this.app.screen.height);
        
        // 添加所有容器到舞台
        this.app.stage.addChild(this.background);          // 背景在最底層
        this.app.stage.addChild(this.trackContainer);      // 軌道容器
        this.app.stage.addChild(this.timeline.getContainer()); // 時間軸在最上層
        
        // 設置事件監聽
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    public addTrack(track: ITrack) {
        console.log("Adding track:", track.id);  // 檢查點 2
        const trackComponent = new Track(track, this.tracks.size);
        this.tracks.set(track.id, trackComponent);
        this.trackContainer.addChild(trackComponent.getContainer());
        console.log("Track added, container children:", this.trackContainer.children.length);  // 檢查點 3
    }

    public addClip(clip: IClip) {
        console.log(`DAWManager: Adding clip ${clip.id} to track ${clip.trackId}`);
        
        const track = this.tracks.get(clip.trackId);
        if (!track) {
            console.error(`Track ${clip.trackId} not found`);
            return;
        }
        
        track.addClip(clip, this.timeline.getGridSize());
        this.eventManager.emit('daw:clip:added', { clip });
    }

    public removeClip(clipId: string, trackId: string) {
        const track = this.tracks.get(trackId);
        if (track) {
            track.removeClip(clipId);
            this.eventManager.emit('daw:clip:removed', { clipId });
        }
    }

    public setPosition(position: number) {
        this.timeline.setPosition(position);
    }

    private handleResize = () => {
        this.background
            .clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, this.app.screen.width, this.app.screen.height);
        
        this.timeline.update();
        this.tracks.forEach(track => {
            track.update();
            track.updateClips();
        });
    }

    public destroy() {
        window.removeEventListener('resize', this.handleResize);
        this.timeline.destroy();
        this.tracks.forEach(track => track.destroy());
        this.app.stage.removeChild(this.trackContainer);
        this.app.stage.removeChild(this.timeline.getContainer());
    }

    private setupTrackEvents() {
        this.eventManager.on('daw:track:dragend', (data: { trackId: string; finalY: number }) => {
            // 計算新的索引位置
            const newIndex = Math.floor((data.finalY - 50) / 80);
            this.reorderTracks(data.trackId, newIndex);
        });
    }

    private reorderTracks(draggedTrackId: string, newIndex: number) {
        const tracks = Array.from(this.tracks.entries());
        const oldIndex = tracks.findIndex(([id]) => id === draggedTrackId);
        
        if (oldIndex === -1) return;
        
        // 確保新索引在有效範圍內
        const clampedNewIndex = Math.max(0, Math.min(newIndex, tracks.length - 1));
        
        if (clampedNewIndex === oldIndex) return; // 如果位置沒變，直接返回
        
        // 創建新的順序數組
        const trackOrder = tracks.map(([id]) => id);
        trackOrder.splice(oldIndex, 1);
        trackOrder.splice(clampedNewIndex, 0, draggedTrackId);

        // 更新所有軌道的位置
        trackOrder.forEach((id, index) => {
            const track = this.tracks.get(id);
            if (track) {
                const targetY = 50 + (index * 80);
                requestAnimationFrame(() => {
                    track.setY(targetY);
                });
            }
        });

        // 更新內部數據結構
        const newTracks = new Map<string, Track>();
        trackOrder.forEach(id => {
            const track = this.tracks.get(id);
            if (track) {
                newTracks.set(id, track);
            }
        });
        this.tracks = newTracks;

        // 發送重新排序事件
        this.eventManager.emit('daw:track:reordered', { 
            trackId: draggedTrackId,
            newIndex: clampedNewIndex
        });
    }
} 