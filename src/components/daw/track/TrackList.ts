import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";
import { Track } from "./Track";
import { ITrack } from "../../../types/daw";
import { DAWConfig } from "../../../config/DAWConfig";
import { DAWEventPayload } from "../../../types/events";

export class TrackList extends BaseComponent {
    private tracks: Map<string, Track>;
    private trackOrder: string[];
    private _lastTargetIndex: number;
    private _draggedTrackId: string | null = null;
    private background: PIXI.Graphics;

    constructor(private app: PIXI.Application) {
        super();
        this.tracks = new Map();
        this.trackOrder = [];
        this._lastTargetIndex = -1;
        this.init();
    }

    private init() {
        // 設置容器屬性
        this.container.sortableChildren = true;
        this.container.eventMode = 'static';
        this.container.position.set(0, 0);

        // 創建背景
        this.background = new PIXI.Graphics();
        this.container.addChild(this.background);
        
        // 繪製背景
        this.drawBackground();

        // 設置事件監聽
        this.setupEvents();
    }

    private drawBackground() {
        const { width, height } = this.app.screen;
        const contentWidth = Math.max(width * 2, 3000); // 確保有足夠的寬度

        this.background.clear()
            .fill({ color: 0x1a1a1a })
            .rect(0, 0, contentWidth, height);
    }

    private setupEvents() {
        // 監聽拖動相關事件
        this.eventManager.on('track:drag', (data) => this.handleTrackDrag(data));
        this.eventManager.on('track:dragend', (data) => this.handleTrackDragEnd(data));
    }

    private handleTrackDrag({ trackId, y }: DAWEventPayload['track:drag']) {
        const track = this.tracks.get(trackId);
        if (!track) return;

        // 設置當前拖動的軌道 ID
        this._draggedTrackId = trackId;

        const currentIndex = this.trackOrder.indexOf(trackId);
        const targetIndex = this.calculateTargetIndex(y);

        // 更新拖動中的軌道位置
        const adjustedY = y - DAWConfig.dimensions.topBarHeight - DAWConfig.dimensions.timelineHeight;
        track.setY(adjustedY);

        // 如果跨越了不同的軌道
        if (targetIndex !== this._lastTargetIndex && 
            targetIndex >= 0 && 
            targetIndex < this.trackOrder.length) {
            
            // 處理軌道跨越事件
            this.handleTrackCrossover(currentIndex, targetIndex);
            this._lastTargetIndex = targetIndex;
        }
    }

    private handleTrackCrossover(fromIndex: number, toIndex: number) {
        if (!this._draggedTrackId) return;

        // 重置所有軌道的預覽狀態
        this.tracks.forEach(t => t.resetPreviewState());

        // 確定移動方向和需要移動的軌道範圍
        const moveDirection = toIndex > fromIndex ? 1 : -1;
        
        // 創建臨時的軌道順序陣列來模擬移動後的狀態
        let tempOrder = [...this.trackOrder];
        const draggedTrack = tempOrder.splice(fromIndex, 1)[0];
        tempOrder.splice(toIndex, 0, draggedTrack);

        // 計算每個軌道的新位置
        tempOrder.forEach((trackId, newIndex) => {
            // 跳過被拖動的軌道
            if (trackId === this._draggedTrackId) return;

            const track = this.tracks.get(trackId);
            if (track) {
                const targetY = newIndex * DAWConfig.dimensions.trackHeight;
                track.setPreviewState(true);
                this.animateTrackPosition(track, targetY);
            }
        });
    }

    private calculateTargetIndex(y: number): number {
        const { topBarHeight, timelineHeight, trackHeight } = DAWConfig.dimensions;
        const adjustedY = y - (topBarHeight + timelineHeight);
        
        // 使用軌道的中心點來判斷位置
        const index = Math.floor((adjustedY + trackHeight / 2) / trackHeight);
        return Math.max(0, Math.min(index, this.trackOrder.length - 1));
    }

    private previewTrackSwap(currentIndex: number, targetIndex: number) {
        // 獲取目標軌道
        const targetTrackId = this.trackOrder[targetIndex];
        const targetTrack = this.tracks.get(targetTrackId);
        if (!targetTrack) return;

        // 計算目標位置
        const targetY = currentIndex * DAWConfig.dimensions.trackHeight;
        
        // 只移動目標軌道到當前拖動軌道的位置
        this.animateTrackPosition(targetTrack, targetY);
    }

    private animateTrackPosition(track: Track, targetY: number) {
        const startY = track.getY();
        const duration = 150; // 動畫持續時間（毫秒）
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

    private handleTrackDragEnd({ trackId, y }: DAWEventPayload['track:dragend']) {
        const targetIndex = this.calculateTargetIndex(y);
        const currentIndex = this.trackOrder.indexOf(trackId);
        
        if (targetIndex !== currentIndex && 
            targetIndex >= 0 && 
            targetIndex < this.trackOrder.length) {
            
            // 更新軌道順序
            this.trackOrder.splice(currentIndex, 1);
            this.trackOrder.splice(targetIndex, 0, trackId);
            
            // 更新所有軌道的位置
            this.updateTrackPositions();
            
            this.eventManager.emit('daw:track:reorder', {
                trackId,
                newIndex: targetIndex
            });
        } else {
            // 如果沒有改變位置，將所有軌道返回原位
            this.updateTrackPositions();
        }

        // 重置所有狀態
        this.tracks.forEach(t => t.resetPreviewState());
        this._lastTargetIndex = -1;
        this._draggedTrackId = null;
    }

    public addTrack(trackData: ITrack): void {
        try {
            console.log('Creating new track with data:', trackData);
            
            if (!trackData || !trackData.id) {
                throw new Error('Invalid track data');
            }

            if (this.tracks.has(trackData.id)) {
                throw new Error(`Track with id ${trackData.id} already exists`);
            }

            const track = new Track(
                trackData,
                this.tracks.size,
                DAWConfig.dimensions.gridSize
            );
            
            if (!track.getContainer()) {
                throw new Error('Track container initialization failed');
            }
            
            console.log('Track created successfully, adding to container');
            this.tracks.set(trackData.id, track);
            this.trackOrder.push(trackData.id);
            this.container.addChild(track.getContainer());
            
            this.updateTrackPositions();
            console.log('Track added successfully:', trackData.id);
        } catch (error) {
            console.error('Failed to add track:', error);
            throw error;
        }
    }

    public moveTrack(id: string, newIndex: number): void {
        const track = this.tracks.get(id);
        if (!track) return;

        const oldIndex = this.trackOrder.indexOf(id);
        if (oldIndex === -1) return;

        // 即使位置相同也要重置狀態
        if (oldIndex === newIndex) {
            this.tracks.forEach(t => t.resetPreviewState());
            const targetY = oldIndex * DAWConfig.dimensions.trackHeight;
            this.animateTrackPosition(track, targetY);
            return;
        }

        // 獲取要交換的軌道
        const targetTrackId = this.trackOrder[newIndex];
        const targetTrack = this.tracks.get(targetTrackId);
        if (!targetTrack) return;

        // 更新軌道順序
        [this.trackOrder[oldIndex], this.trackOrder[newIndex]] = 
        [this.trackOrder[newIndex], this.trackOrder[oldIndex]];

        // 重置所有軌道的狀態
        this.tracks.forEach(t => t.resetPreviewState());

        // 移動兩個軌道到新位置
        this.animateTrackPosition(track, newIndex * DAWConfig.dimensions.trackHeight);
        this.animateTrackPosition(targetTrack, oldIndex * DAWConfig.dimensions.trackHeight);

        this.eventManager.emit('daw:track:reorder', {
            trackId: id,
            newIndex
        });
    }

    private updateTrackPositions(): void {
        this.trackOrder.forEach((id, index) => {
            const track = this.tracks.get(id);
            if (track) {
                const targetY = index * DAWConfig.dimensions.trackHeight;
                this.animateTrackPosition(track, targetY);
            }
        });
    }

    public getTrack(id: string): Track | undefined {
        return this.tracks.get(id);
    }

    public getTracks(): Track[] {
        return Array.from(this.tracks.values());
    }

    public update(): void {
        this.tracks.forEach(track => track.update());
    }

    public override destroy(): void {
        // 清理所有軌道
        this.tracks.forEach(track => track.destroy());
        this.tracks.clear();
        this.trackOrder = [];
        
        // 清理容器
        this.container.destroy({ children: true });
        
        // 移除事件監聽
        this.eventManager.off('track:drag', this.handleTrackDrag);
        this.eventManager.off('track:dragend', this.handleTrackDragEnd);
    }

    public removeTrack(trackId: string): void {
        const track = this.tracks.get(trackId);
        if (!track) return;

        track.destroy();
        this.tracks.delete(trackId);
        
        // 更新其他軌道的位置
        this.updateTrackPositions();
    }

    public setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }
} 