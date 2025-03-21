import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { Track } from "./Track";
import { ITrack } from "../../../types/daw";
import { DAWConfig } from "../../../config/DAWConfig";
import { DAWEventPayload } from "../../../types/events";

export class TrackList extends BaseComponent {
    private tracks: Map<string, Track> = new Map();
    private trackOrder: string[] = [];

    constructor(private app: PIXI.Application) {
        super();
        this.init();
    }

    private init() {
        this.container.sortableChildren = true;
        this.setupEvents();
    }

    private setupEvents() {
        // 監聽拖動相關事件
        this.eventManager.on('track:drag', (data) => this.handleTrackDrag(data));
        this.eventManager.on('track:dragend', (data) => this.handleTrackDragEnd(data));
    }

    private handleTrackDrag({ trackId, y }: DAWEventPayload['track:drag']) {
        const track = this.tracks.get(trackId);
        if (!track) return;

        const currentIndex = this.trackOrder.indexOf(trackId);
        const targetIndex = this.calculateTargetIndex(y);

        if (targetIndex !== currentIndex) {
            this.eventManager.emit('daw:track:preview', {
                trackId,
                currentIndex,
                targetIndex
            });
        }
    }

    private handleTrackDragEnd({ trackId, y }: DAWEventPayload['track:dragend']) {
        const targetIndex = this.calculateTargetIndex(y);
        this.moveTrack(trackId, targetIndex);
    }

    private calculateTargetIndex(y: number): number {
        return Math.max(0, Math.floor(
            (y - DAWConfig.dimensions.topBarHeight) / 
            DAWConfig.dimensions.trackHeight
        ));
    }

    public addTrack(trackData: ITrack): void {
        try {
            const track = new Track(
                trackData,
                this.tracks.size,
                DAWConfig.dimensions.gridSize
            );
            
            this.tracks.set(trackData.id, track);
            this.trackOrder.push(trackData.id);
            this.container.addChild(track.getContainer());
            
            this.updateTrackPositions();
            this.eventManager.emit('track:added', { track: trackData });
        } catch (error) {
            console.error('Failed to add track:', error);
            throw new Error(`Failed to add track ${trackData.id}`);
        }
    }

    public moveTrack(id: string, newIndex: number): void {
        const track = this.tracks.get(id);
        if (!track) {
            console.warn(`Track ${id} not found`);
            return;
        }

        const oldIndex = this.trackOrder.indexOf(id);
        if (oldIndex === -1) return;

        const clampedNewIndex = Math.max(0, 
            Math.min(newIndex, this.trackOrder.length - 1)
        );
        
        if (clampedNewIndex === oldIndex) return;

        // 更新軌道順序
        this.trackOrder.splice(oldIndex, 1);
        this.trackOrder.splice(clampedNewIndex, 0, id);

        this.updateTrackPositions();
        
        this.eventManager.emit('daw:track:reorder', {
            trackId: id,
            newIndex: clampedNewIndex
        });
    }

    private updateTrackPositions(): void {
        this.trackOrder.forEach((id, index) => {
            const track = this.tracks.get(id);
            if (track) {
                const targetY = DAWConfig.dimensions.topBarHeight + 
                              (index * DAWConfig.dimensions.trackHeight);
                track.setY(targetY);
            }
        });
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
        this.trackOrder = [];
        super.destroy();
    }

    public removeTrack(trackId: string): void {
        const track = this.tracks.get(trackId);
        if (!track) return;

        track.destroy();
        this.tracks.delete(trackId);
        
        // 更新其他軌道的位置
        this.updateTrackPositions();
    }
} 