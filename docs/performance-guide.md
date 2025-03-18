# Performance Guide 效能指南

## Optimization Strategies 優化策略

### 1. Graphics Rendering 圖形渲染
```typescript
// Batch drawing operations 批次繪圖操作
private batchDraw(): void {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xffffff);
    
    // Draw multiple shapes in one pass 一次繪製多個形狀
    this.windows.forEach(window => {
        graphics.drawRect(
            window.x,
            window.y,
            window.width,
            window.height
        );
    });
    
    graphics.endFill();
}
```

### 2. Memory Management 記憶體管理
```typescript
// Object pooling example 物件池示例
class WindowPool {
    private static pool: FloatingWindow[] = [];

    public static acquire(options: IWindowOptions): FloatingWindow {
        return this.pool.pop() || new FloatingWindow(options);
    }

    public static release(window: FloatingWindow): void {
        window.reset();
        this.pool.push(window);
    }
}
```

### 3. Event Optimization 事件優化
- Use event delegation 使用事件委派
- Implement debouncing 實現防抖
- Batch event updates 批次更新事件 