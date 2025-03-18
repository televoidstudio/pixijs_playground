# Troubleshooting Guide 故障排除指南

## Common Issues 常見問題

### 1. Window Rendering Issues 視窗渲染問題

#### Symptoms 症狀
- Blank windows 空白視窗
- Flickering 閃爍
- Incorrect positioning 位置不正確

#### Solutions 解決方案
```typescript
// Check PIXI application context 檢查PIXI應用程式上下文
if (!this.app.renderer) {
    throw new Error('PIXI renderer not initialized');
}

// Verify window dimensions 驗證視窗尺寸
if (width <= 0 || height <= 0) {
    console.warn('Invalid window dimensions');
    return;
}
```

### 2. Memory Leaks 記憶體洩漏

#### Detection 檢測
```typescript
// Memory usage monitoring 記憶體使用監控
class MemoryMonitor {
    public static track(window: FloatingWindow): void {
        console.log('Window created:', performance.memory);
        window.on('destroy', () => {
            console.log('Window destroyed:', performance.memory);
        });
    }
}
```

#### Prevention 預防
- Proper cleanup 正確清理
- Event listener removal 移除事件監聽器
- Texture disposal 釋放紋理 