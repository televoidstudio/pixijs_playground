# DAW 事件系統設計文檔

## 1. 事件系統概述

DAW 的事件系統分為兩個主要層次：

1. UI 事件層：處理用戶界面交互
2. Domain 事件層：處理業務邏輯

## 2. 事件類型定義

### 2.1 UI 事件

```typescript
export interface UIEventPayload {
    // 軌道相關事件
    'ui:track:dragstart': { trackId: string; y: number };
    'ui:track:drag': { trackId: string; y: number };
    'ui:track:dragend': { trackId: string; y: number };
    'ui:track:contextmenu': { trackId: string; x: number; y: number };
    
    // 片段相關事件
    'ui:clip:dragstart': { clipId: string; x: number };
    'ui:clip:drag': { clipId: string; x: number };
    'ui:clip:dragend': { clipId: string; x: number };
    'ui:clip:resize': { clipId: string; width: number };
    
    // 時間軸相關事件
    'ui:timeline:scroll': { scrollX: number };
    'ui:timeline:zoom': { zoomLevel: number };
}
```

### 2.2 Domain 事件

```typescript
export interface DomainEventPayload {
    // 軌道相關事件
    'domain:track:reordered': { trackId: string; newIndex: number };
    'domain:track:added': { track: Track };
    'domain:track:removed': { trackId: string };
    
    // 片段相關事件
    'domain:clip:moved': { clipId: string; newStartTime: number };
    'domain:clip:resized': { clipId: string; newDuration: number };
    'domain:clip:added': { clip: Clip };
    'domain:clip:removed': { clipId: string };
    
    // 音頻相關事件
    'domain:audio:playback:started': void;
    'domain:audio:playback:stopped': void;
    'domain:audio:playback:paused': void;
}
```

## 3. 事件總線實現

### 3.1 UI 事件總線

```typescript
class UIEventBus {
    private eventEmitter = new EventEmitter();
    
    emit<K extends keyof UIEventPayload>(
        event: K,
        payload: UIEventPayload[K]
    ): void {
        this.eventEmitter.emit(event, payload);
    }
    
    on<K extends keyof UIEventPayload>(
        event: K,
        handler: (payload: UIEventPayload[K]) => void
    ): void {
        this.eventEmitter.on(event, handler);
    }
}
```

### 3.2 Domain 事件總線

```typescript
class DomainEventBus {
    private eventEmitter = new EventEmitter();
    
    emit<K extends keyof DomainEventPayload>(
        event: K,
        payload: DomainEventPayload[K]
    ): void {
        this.eventEmitter.emit(event, payload);
    }
    
    on<K extends keyof DomainEventPayload>(
        event: K,
        handler: (payload: DomainEventPayload[K]) => void
    ): void {
        this.eventEmitter.on(event, handler);
    }
}
```

## 4. 事件轉換器

事件轉換器負責將 UI 事件轉換為 Domain 事件：

```typescript
class EventTranslator {
    constructor(
        private uiEventBus: UIEventBus,
        private domainEventBus: DomainEventBus
    ) {
        this.setupEventTranslations();
    }
    
    private setupEventTranslations(): void {
        // 軌道拖拽事件轉換
        this.uiEventBus.on('ui:track:dragend', (payload) => {
            const newIndex = this.calculateNewTrackIndex(payload.trackId, payload.y);
            this.domainEventBus.emit('domain:track:reordered', {
                trackId: payload.trackId,
                newIndex
            });
        });
        
        // 片段拖拽事件轉換
        this.uiEventBus.on('ui:clip:dragend', (payload) => {
            const newStartTime = this.calculateNewStartTime(payload.clipId, payload.x);
            this.domainEventBus.emit('domain:clip:moved', {
                clipId: payload.clipId,
                newStartTime
            });
        });
    }
}
```

## 5. 使用示例

### 5.1 在 UI 組件中使用

```typescript
class TrackComponent extends BaseComponent {
    constructor(private uiEventBus: UIEventBus) {
        super();
        this.setupEventHandlers();
    }
    
    private setupEventHandlers(): void {
        // 處理拖拽開始
        this.on('pointerdown', (event) => {
            this.uiEventBus.emit('ui:track:dragstart', {
                trackId: this.trackId,
                y: event.data.global.y
            });
        });
        
        // 處理拖拽
        this.on('pointermove', (event) => {
            this.uiEventBus.emit('ui:track:drag', {
                trackId: this.trackId,
                y: event.data.global.y
            });
        });
        
        // 處理拖拽結束
        this.on('pointerup', (event) => {
            this.uiEventBus.emit('ui:track:dragend', {
                trackId: this.trackId,
                y: event.data.global.y
            });
        });
    }
}
```

### 5.2 在領域服務中使用

```typescript
class TrackService {
    constructor(private domainEventBus: DomainEventBus) {
        this.setupEventHandlers();
    }
    
    private setupEventHandlers(): void {
        // 處理軌道重排序
        this.domainEventBus.on('domain:track:reordered', (payload) => {
            this.reorderTrack(payload.trackId, payload.newIndex);
        });
        
        // 處理軌道添加
        this.domainEventBus.on('domain:track:added', (payload) => {
            this.addTrack(payload.track);
        });
    }
}
```

## 6. 最佳實踐

1. **事件命名規範**
   - UI 事件使用 `ui:` 前綴
   - Domain 事件使用 `domain:` 前綴
   - 事件名稱使用小寫字母和冒號分隔

2. **事件處理原則**
   - UI 事件只處理視覺反饋
   - Domain 事件處理業務邏輯
   - 使用事件轉換器連接兩層

3. **類型安全**
   - 使用 TypeScript 接口定義事件類型
   - 確保事件處理器類型正確

4. **性能考慮**
   - 避免過多的事件監聽
   - 及時移除不需要的事件監聽器
   - 使用防抖和節流處理頻繁事件

5. **錯誤處理**
   - 在事件處理器中捕獲並處理錯誤
   - 提供錯誤事件類型
   - 記錄錯誤日誌
