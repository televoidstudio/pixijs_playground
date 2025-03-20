import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { Track } from "./Track";
import { ITrack } from "../../../types/daw";
import { DAWConfig } from "../../../config/DAWConfig";

export class TrackList extends BaseComponent {
    private tracks: Map<string, Track> = new Map();

    constructor(private app: PIXI.Application) {
        super();
        this.init();
    }

    private init() {
        // 初始化容器
        this.container.sortableChildren = true;
    }

    public addTrack(trackData: ITrack): void {
        const track = new Track(
            trackData,
            this.tracks.size,
            DAWConfig.dimensions.gridSize
        );
        
        this.tracks.set(trackData.id, track);
        this.container.addChild(track.getContainer());
        
        this.eventManager.emit('daw:track:added', { track: trackData });
    }

    public moveTrack(id: string, newIndex: number): void {
        const track = this.tracks.get(id);
        if (!track) return;

        const tracks = Array.from(this.tracks.entries());
        const oldIndex = tracks.findIndex(([trackId]) => trackId === id);
        
        if (oldIndex === -1) return;
        
        const clampedNewIndex = Math.max(0, Math.min(newIndex, tracks.length - 1));
        if (clampedNewIndex === oldIndex) return;
        
        const trackOrder = tracks.map(([trackId]) => trackId);
        trackOrder.splice(oldIndex, 1);
        trackOrder.splice(clampedNewIndex, 0, id);

        // 更新所有軌道的位置
        trackOrder.forEach((trackId, index) => {
            const track = this.tracks.get(trackId);
            if (track) {
                const targetY = DAWConfig.dimensions.topBarHeight + 
                              (index * DAWConfig.dimensions.trackHeight);
                track.setY(targetY);
            }
        });

        // 更新內部數據結構
        const newTracks = new Map<string, Track>();
        trackOrder.forEach(trackId => {
            const track = this.tracks.get(trackId);
            if (track) {
                newTracks.set(trackId, track);
            }
        });
        this.tracks = newTracks;
    }

    public getTrack(id: string): Track | undefined {
        return this.tracks.get(id);
    }

    public update(): void {
        this.tracks.forEach(track => track.update());
    }

    public override destroy(): void {
        this.tracks.forEach(track => track.destroy());
        this.tracks.clear();
        this.container.destroy();
    }
} 