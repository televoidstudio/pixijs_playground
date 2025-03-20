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
        
        this.eventManager.emit('track:added', { track: trackData });
    }

    public moveTrack(id: string, newIndex: number): void {
        const track = this.tracks.get(id);
        if (!track) return;

        const { topBarHeight, trackHeight } = DAWConfig.dimensions;
        const newY = topBarHeight + (newIndex * trackHeight);
        track.setY(newY);
    }

    public setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    public setZIndex(index: number): void {
        this.container.zIndex = index;
    }

    public destroy(): void {
        this.tracks.forEach(track => track.destroy());
        this.tracks.clear();
        super.destroy();
    }
} 