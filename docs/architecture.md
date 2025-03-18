# Architecture 架構

## Core Components 核心元件

### 1. Window Manager 視窗管理器
- **Purpose 用途**: Manages all floating windows and their interactions
- **Key Features 主要功能**:
  - Window creation and destruction 視窗的創建和銷毀
  - Z-index management Z軸層級管理
  - Focus handling 焦點處理
  - Event distribution 事件分發

### 2. Event System 事件系統
- **Implementation 實現方式**: 
  - Uses custom event emitter 使用自定義事件發射器
  - Supports typed events 支援類型化事件
  - Provides event bubbling 提供事件冒泡機制

### 3. Theme System 主題系統
- **Configuration 配置**:
  - Centralized theme management 集中式主題管理
  - Dynamic color schemes 動態配色方案
  - Customizable dimensions 可自定義尺寸

## File Structure 文件結構

```typescript
src/
├── components/
│   └── window/
│       └── FloatingWindow/
├── config/
│   └── theme.ts
├── types/
│   └── window.ts
├── utils/
│   └── managers/
└── hooks/
```

## Implementation Details 實現細節

### Window Creation Process 視窗創建流程
1. User requests new window 用戶請求新視窗
2. WindowManager creates instance WindowManager創建實例
3. Applies theme configuration 應用主題配置
4. Sets up event listeners 設置事件監聽器
5. Renders to PIXI stage 渲染到PIXI舞台 