import { UIEventBus } from '../ui/UIEventBus';
import { DomainEventBus } from '../domain/DomainEventBus';
import { DAW_EVENTS } from './types';

/**
 * 事件轉換器
 * 負責將 UI 事件轉換為領域事件
 */
export class EventTranslator {
    private static instance: EventTranslator;
    private uiEventBus: UIEventBus;
    private domainEventBus: DomainEventBus;

    private constructor() {
        this.uiEventBus = UIEventBus.getInstance();
        this.domainEventBus = DomainEventBus.getInstance();
        this.setupEventTranslations();
    }

    /**
     * 獲取 EventTranslator 單例
     */
    public static getInstance(): EventTranslator {
        if (!EventTranslator.instance) {
            EventTranslator.instance = new EventTranslator();
        }
        return EventTranslator.instance;
    }

    /**
     * 設置事件轉換
     */
    private setupEventTranslations(): void {
        this.setupTrackEventTranslations();
        this.setupClipEventTranslations();
        this.setupPlaybackEventTranslations();
    }

    /**
     * 設置音軌相關事件轉換
     */
    private setupTrackEventTranslations(): void {
        // 處理音軌拖拽結束事件
        this.uiEventBus.on(DAW_EVENTS.TRACK.DRAGEND, (payload) => {
            this.domainEventBus.emit(DAW_EVENTS.TRACK.REORDERED, {
                trackId: payload.trackId,
                newIndex: payload.newIndex
            });
        });

        // 處理音軌添加事件
        this.uiEventBus.on(DAW_EVENTS.TRACK.ADD, (payload) => {
            this.domainEventBus.emit(DAW_EVENTS.TRACK.ADDED, {
                trackId: payload.trackId,
                type: payload.type
            });
        });

        // 處理音軌刪除事件
        this.uiEventBus.on(DAW_EVENTS.TRACK.REMOVE, (payload) => {
            this.domainEventBus.emit(DAW_EVENTS.TRACK.REMOVED, {
                trackId: payload.trackId
            });
        });
    }

    /**
     * 設置片段相關事件轉換
     */
    private setupClipEventTranslations(): void {
        // 處理片段拖拽結束事件
        this.uiEventBus.on(DAW_EVENTS.CLIP.DRAGEND, (payload) => {
            this.domainEventBus.emit(DAW_EVENTS.CLIP.MOVED, {
                clipId: payload.clipId,
                trackId: payload.trackId,
                newStartTime: payload.newStartTime
            });
        });

        // 處理片段調整大小事件
        this.uiEventBus.on(DAW_EVENTS.CLIP.RESIZE, (payload) => {
            this.domainEventBus.emit(DAW_EVENTS.CLIP.RESIZED, {
                clipId: payload.clipId,
                newDuration: payload.newDuration
            });
        });
    }

    /**
     * 設置播放控制相關事件轉換
     */
    private setupPlaybackEventTranslations(): void {
        // 處理播放事件
        this.uiEventBus.on(DAW_EVENTS.PLAYBACK.PLAY, () => {
            this.domainEventBus.emit(DAW_EVENTS.PLAYBACK.STARTED, {
                timestamp: Date.now()
            });
        });

        // 處理暫停事件
        this.uiEventBus.on(DAW_EVENTS.PLAYBACK.PAUSE, () => {
            this.domainEventBus.emit(DAW_EVENTS.PLAYBACK.PAUSED, {
                timestamp: Date.now()
            });
        });

        // 處理停止事件
        this.uiEventBus.on(DAW_EVENTS.PLAYBACK.STOP, () => {
            this.domainEventBus.emit(DAW_EVENTS.PLAYBACK.STOPPED, {
                timestamp: Date.now()
            });
        });
    }
} 