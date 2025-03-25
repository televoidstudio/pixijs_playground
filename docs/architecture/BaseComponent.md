# BaseComponent 設計文檔

## 1. 概述

`BaseComponent` 是 DAW 應用中所有 UI 組件的基礎類。它提供了統一的組件生命週期管理、事件處理和渲染功能。

## 2. 類結構

```typescript
export abstract class BaseComponent {
    protected container: PIXI.Container;
    private readonly id: string;
    protected readonly uiEventBus: UIEventBus;
    protected readonly domainEventBus: DomainEventBus;
}
```

### 2.1 核心屬性

- `container`: PIXI 容器實例，用於管理視覺元素
- `id`: 組件唯一標識符
- `uiEventBus`: UI 事件總線實例
- `domainEventBus`: 領域事件總線實例

## 3. 生命週期

### 3.1 初始化階段

```typescript
constructor(id: string) {
    this.id = id;
    this.uiEventBus = UIEventBus.getInstance();
    this.domainEventBus = DomainEventBus.getInstance();
    this.container = new PIXI.Container();
    
    // 初始化組件
    this.setupComponent();
    this.setupEventHandlers();
}
```

1. 創建 PIXI 容器
2. 設置容器屬性（sortableChildren、eventMode 等）
3. 調用 `setupComponent` 進行組件初始化
4. 調用 `setupEventHandlers` 設置事件處理器

### 3.2 抽象方法

- `setupComponent()`: 初始化組件的視覺元素
- `setupEventHandlers()`: 設置組件的事件處理器
- `update()`: 更新組件狀態

### 3.3 銷毀階段

```typescript
destroy(): void {
    this.uiEventBus.removeAllListeners();
    this.container.destroy({ children: true });
}
```

## 4. 事件處理

### 4.1 UI 事件

```typescript
protected emitUIEvent<K extends keyof UIEventPayload>(
    event: K,
    payload: UIEventPayload[K]
): void {
    this.uiEventBus.emit(event, { ...payload, componentId: this.id });
}

protected onUIEvent<K extends keyof UIEventPayload>(
    event: K,
    handler: (payload: UIEventPayload[K]) => void
): void {
    this.uiEventBus.on(event, handler);
}

protected offUIEvent<K extends keyof UIEventPayload>(
    event: K,
    handler: (payload: UIEventPayload[K]) => void
): void {
    this.uiEventBus.off(event, handler);
}
```

## 5. 視覺控制

### 5.1 位置和大小

```typescript
setPosition(x: number, y: number): void
setZIndex(zIndex: number): void
setVisible(visible: boolean): void
```

## 6. 使用示例

### 6.1 基本組件實現

```typescript
class TrackComponent extends BaseComponent {
    constructor(trackId: string) {
        super(trackId);
    }

    protected setupComponent(): void {
        // 初始化軌道視覺元素
        const background = new PIXI.Graphics();
        background.fill({ color: 0x2a2a2a })
            .rect(0, 0, 800, 100);
        this.container.addChild(background);
    }

    protected setupEventHandlers(): void {
        // 設置拖拽事件
        this.container.on('pointerdown', (event) => {
            this.emitUIEvent('ui:track:dragstart', {
                trackId: this.getId(),
                y: event.global.y
            });
        });
    }

    public update(): void {
        // 更新組件狀態
    }
}
```

## 7. 最佳實踐

### 7.1 組件命名

- 使用有意義的 ID
- ID 格式：`{component-type}-{unique-identifier}`
- 例如：`track-1`, `clip-2`, `timeline-main`

### 7.2 事件處理

- 在 `setupEventHandlers` 中集中管理事件
- 使用類型安全的事件發送和監聽
- 及時清理不需要的事件監聽器

### 7.3 渲染優化

- 適當使用 `sortableChildren`
- 控制更新頻率
- 使用 `zIndex` 管理層級

### 7.4 資源管理

- 在 `destroy` 中清理所有資源
- 移除所有事件監聽器
- 銷毀所有子元素

## 8. 注意事項

1. **類型安全**
   - 使用 TypeScript 的類型系統
   - 確保事件類型正確
   - 避免使用 `any` 類型

2. **性能考慮**
   - 避免過多的事件監聽器
   - 合理使用更新機制
   - 注意內存洩漏

3. **錯誤處理**
   - 捕獲並處理初始化錯誤
   - 提供錯誤回調機制
   - 記錄關鍵操作日誌

4. **擴展性**
   - 保持方法的單一職責
   - 提供合適的擴展點
   - 遵循開閉原則 