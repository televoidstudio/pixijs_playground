# DAW 組件開發指南

本文檔說明如何基於 `BaseComponent` 創建新的 DAW 組件。

## 基礎結構

所有 DAW 組件都應該繼承 `BaseComponent` 抽象類，該類提供了基本的容器管理和事件處理功能。

```typescript
import * as PIXI from "pixi.js";
import { BaseComponent } from "../core/BaseComponent";

export class MyComponent extends BaseComponent {
    constructor() {
        super();
        this.init();
    }

    private init(): void {
        // 初始化組件
    }

    public update(): void {
        // 實現更新邏輯
    }

    public destroy(): void {
        // 實現清理邏輯
    }
}
```

## 必要方法實現

### 1. 初始化方法

建議在私有的 `init` 方法中進行組件的初始化：

```typescript
private init(): void {
    // 1. 設置容器屬性
    this.container.sortableChildren = true;
    
    // 2. 創建視覺元素
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x000000);
    graphics.drawRect(0, 0, 100, 100);
    graphics.endFill();
    
    // 3. 添加到容器
    this.container.addChild(graphics);
    
    // 4. 設置事件監聽
    this.setupEvents();
}
```

### 2. 事件處理

使用 `eventManager` 處理組件間的通信：

```typescript
private setupEvents(): void {
    // 監聽事件
    this.eventManager.on('some:event', (data) => {
        this.handleEvent(data);
    });

    // 發送事件
    this.eventManager.emit('my:event', { 
        someData: 'value' 
    });
}
```

### 3. 更新方法

實現 `update` 方法以響應狀態變化：

```typescript
public update(): void {
    // 更新視覺狀態
    this.updateVisuals();
    
    // 更新子組件
    this.updateChildren();
}
```

### 4. 清理方法

實現 `destroy` 方法以正確清理資源：

```typescript
public destroy(): void {
    // 移除事件監聽
    this.eventManager.off('some:event');
    
    // 清理子元素
    this.container.removeChildren();
    
    // 銷毀容器
    this.container.destroy();
}
```

## 最佳實踐

1. **組件封裝**
   - 將相關的邏輯和視覺元素封裝在一個組件中
   - 使用私有方法處理內部邏輯
   - 提供公共方法作為 API

    ```typescript
    export class TrackComponent extends BaseComponent {
        private background: PIXI.Graphics;
        private controls: PIXI.Container;

        public setVolume(value: number): void {
            // 公共 API
        }

        private updateBackground(): void {
            // 私有實現
        }
    }
    ```

2. **事件處理**
   - 使用明確的事件名稱
   - 在 `destroy` 方法中清理所有事件監聽
   - 使用類型定義確保事件數據的正確性

    ```typescript
    interface MyEventPayload {
        'component:action': { id: string; value: number };
    }

    private setupEvents(): void {
        this.eventManager.on('component:action', (data) => {
            // 處理事件
        });
    }
    ```

3. **錯誤處理**
   - 在關鍵操作中使用錯誤處理
   - 提供有意義的錯誤信息

    ```typescript
    public someOperation(): void {
        try {
            // 執行操作
        } catch (error) {
            console.error('Operation failed:', error);
            this.eventManager.emit('component:error', { 
                error: error.message 
            });
        }
    }
    ```

4. **性能考慮**
   - 避免在 `update` 方法中進行昂貴的操作
   - 適當使用 PIXI.js 的緩存功能
   - 及時清理不需要的資源

    ```typescript
    private cacheGraphics(): void {
        const cacheId = 'my-cache';
        if (!PIXI.utils.TextureCache[cacheId]) {
            // 創建並緩存紋理
        }
    }
    ```

## 示例

完整的組件示例：

```typescript
export class MyDAWComponent extends BaseComponent {
    private graphics: PIXI.Graphics;
    private isDragging: boolean = false;

    constructor() {
        super();
        this.init();
    }

    private init(): void {
        this.createVisuals();
        this.setupEvents();
    }

    private createVisuals(): void {
        this.graphics = new PIXI.Graphics();
        this.graphics.beginFill(0x3498db);
        this.graphics.drawRect(0, 0, 100, 50);
        this.graphics.endFill();
        this.graphics.eventMode = 'static';
        this.container.addChild(this.graphics);
    }

    private setupEvents(): void {
        this.graphics.on('pointerdown', this.onDragStart.bind(this));
        this.graphics.on('pointerup', this.onDragEnd.bind(this));
        this.graphics.on('pointermove', this.onDragMove.bind(this));
    }

    private onDragStart(event: PIXI.FederatedPointerEvent): void {
        this.isDragging = true;
        this.eventManager.emit('component:dragstart', {
            id: 'my-component',
            position: event.global
        });
    }

    private onDragMove(event: PIXI.FederatedPointerEvent): void {
        if (this.isDragging) {
            this.container.position.set(
                event.global.x,
                event.global.y
            );
        }
    }

    private onDragEnd(): void {
        this.isDragging = false;
        this.eventManager.emit('component:dragend', {
            id: 'my-component',
            position: this.container.position
        });
    }

    public update(): void {
        // 實現更新邏輯
    }

    public destroy(): void {
        this.graphics.removeAllListeners();
        this.container.destroy({ children: true });
    }
}
```

## 注意事項

1. 始終實現 `update` 和 `destroy` 方法
2. 適當使用 TypeScript 類型
3. 保持組件職責單一
4. 正確處理事件監聽的清理
5. 考慮組件的可重用性
