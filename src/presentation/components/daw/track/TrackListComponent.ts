import * as PIXI from "pixi.js";
import { BaseComponent } from "../../../core/BaseComponent";
import { TrackComponent } from "./TrackComponent";
import { ITrack } from "../../../../types/daw";
import { DAWConfig } from "../../../../config/DAWConfig";

/**
 * 軌道列表組件
 * 負責管理和展示多個軌道，處理軌道之間的交互
 */
export class TrackListComponent extends BaseComponent {
    private tracks: Map<string, TrackComponent>;
    private trackOrder: string[];
    private lastTargetIndex: number;
    private draggedTrackId: string | null = null;
    private background: PIXI.Graphics;

    /**
     * 建構函數
     * @param id 組件唯一標識符
     * @param app PIXI 應用實例
     */
    constructor(id: string, private app: PIXI.Application) {
        super(id);
        this.tracks = new Map();
        this.trackOrder = [];
        this.lastTargetIndex = -1;
    }

    /**
     * 初始化組件
     */
    protected setupComponent(): void {
        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);
        
        // 繪製背景
        this.drawBackground();
    }

    /**
     * 設置事件處理器
     */
    protected setupEventHandlers(): void {
        // 監聽拖動相關事件
        this.onUIEvent('ui:track:drag', this.handleTrackDrag);
        this.onUIEvent('ui:track:dragend', this.handleTrackDragEnd);
    }

    /**
     * 繪製背景
     */
    private drawBackground(): void {
        const { width, height } = this.app.screen;
        const contentWidth = Math.max(width * 2, 3000);

        this.background.clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, contentWidth, height);
    }

    /**
     * 處理軌道拖動
     */
    private handleTrackDrag = (data: { trackId: string; y: number }): void => {
        const track = this.tracks.get(data.trackId);
        if (!track) return;

        this.draggedTrackId = data.trackId;

        const currentIndex = this.trackOrder.indexOf(data.trackId);
        const targetIndex = this.calculateTargetIndex(data.y);

        // 更新拖動中的軌道位置
        const adjustedY = data.y - DAWConfig.dimensions.topBarHeight - DAWConfig.dimensions.timelineHeight;
        track.setY(adjustedY);

        // 如果跨越了不同的軌道
        if (targetIndex !== this.lastTargetIndex && 
            targetIndex >= 0 && 
            targetIndex < this.trackOrder.length) {
            
            this.handleTrackCrossover(currentIndex, targetIndex);
            this.lastTargetIndex = targetIndex;
        }
    };

    /**
     * 處理軌道拖動結束
     */
    private handleTrackDragEnd = (data: { trackId: string; y: number }): void => {
        const targetIndex = this.calculateTargetIndex(data.y);
        const currentIndex = this.trackOrder.indexOf(data.trackId);
        
        if (targetIndex !== currentIndex && 
            targetIndex >= 0 && 
            targetIndex < this.trackOrder.length) {
            
            // 更新軌道順序
            this.trackOrder.splice(currentIndex, 1);
            this.trackOrder.splice(targetIndex, 0, data.trackId);
            
            // 更新所有軌道的位置
            this.updateTrackPositions();
            
            this.emitUIEvent('ui:track:reorder', {
                trackId: data.trackId,
                newIndex: targetIndex
            });
        } else {
            // 如果沒有改變位置，將所有軌道返回原位
            this.updateTrackPositions();
        }

        // 重置所有狀態
        this.tracks.forEach(t => t.setPreviewState(false));
        this.lastTargetIndex = -1;
        this.draggedTrackId = null;
    };

    /**
     * 處理軌道跨越
     */
    private handleTrackCrossover(fromIndex: number, toIndex: number): void {
        if (!this.draggedTrackId) return;

        // 重置所有軌道的預覽狀態
        this.tracks.forEach(t => t.setPreviewState(false));

        // 創建臨時的軌道順序陣列來模擬移動後的狀態
        let tempOrder = [...this.trackOrder];
        const draggedTrack = tempOrder.splice(fromIndex, 1)[0];
        tempOrder.splice(toIndex, 0, draggedTrack);

        // 計算每個軌道的新位置
        tempOrder.forEach((trackId, newIndex) => {
            if (trackId === this.draggedTrackId) return;

            const track = this.tracks.get(trackId);
            if (track) {
                const targetY = newIndex * DAWConfig.dimensions.trackHeight;
                track.setPreviewState(true);
                this.animateTrackPosition(track, targetY);
            }
        });
    }

    /**
     * 計算目標索引
     */
    private calculateTargetIndex(y: number): number {
        const { topBarHeight, timelineHeight, trackHeight } = DAWConfig.dimensions;
        const adjustedY = y - (topBarHeight + timelineHeight);
        
        const index = Math.floor((adjustedY + trackHeight / 2) / trackHeight);
        return Math.max(0, Math.min(index, this.trackOrder.length - 1));
    }

    /**
     * 動畫移動軌道位置
     */
    private animateTrackPosition(track: TrackComponent, targetY: number): void {
        const startY = track.getY();
        const duration = 150;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用 easeOutQuad 緩動函數
            const easeProgress = 1 - Math.pow(1 - progress, 2);
            
            const newY = startY + (targetY - startY) * easeProgress;
            track.setY(newY);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 添加軌道
     */
    public addTrack(trackData: ITrack): void {
        try {
            if (!trackData || !trackData.id) {
                throw new Error('Invalid track data');
            }

            if (this.tracks.has(trackData.id)) {
                throw new Error(`Track with id ${trackData.id} already exists`);
            }

            const track = new TrackComponent(
                `${this.getId()}-track-${trackData.id}`,
                trackData,
                this.tracks.size,
                DAWConfig.dimensions.gridSize
            );
            
            this.tracks.set(trackData.id, track);
            this.trackOrder.push(trackData.id);
            this.container.addChild(track.getContainer());
            
            this.updateTrackPositions();
        } catch (error) {
            console.error('Failed to add track:', error);
            throw error;
        }
    }

    /**
     * 移除軌道
     */
    public removeTrack(trackId: string): void {
        const track = this.tracks.get(trackId);
        if (!track) return;

        track.destroy();
        this.tracks.delete(trackId);
        this.trackOrder = this.trackOrder.filter(id => id !== trackId);
        
        this.updateTrackPositions();
    }

    /**
     * 更新所有軌道位置
     */
    private updateTrackPositions(): void {
        this.trackOrder.forEach((id, index) => {
            const track = this.tracks.get(id);
            if (track) {
                const targetY = index * DAWConfig.dimensions.trackHeight;
                this.animateTrackPosition(track, targetY);
            }
        });
    }

    /**
     * 獲取軌道
     */
    public getTrack(id: string): TrackComponent | undefined {
        return this.tracks.get(id);
    }

    /**
     * 獲取所有軌道
     */
    public getTracks(): TrackComponent[] {
        return Array.from(this.tracks.values());
    }

    /**
     * 更新組件
     */
    public update(): void {
        this.drawBackground();
        this.tracks.forEach(track => track.update());
    }

    /**
     * 銷毀組件
     */
    public override destroy(): void {
        this.tracks.forEach(track => track.destroy());
        this.tracks.clear();
        this.trackOrder = [];
        super.destroy();
    }
} 