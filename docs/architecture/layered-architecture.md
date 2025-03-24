# DAW 分層架構文檔

## 1. 目錄結構

    ```
    src/
    ├── presentation/           # 表現層
    │   ├── components/        # UI 組件
    │   │   ├── daw/          # DAW 相關 UI
    │   │   │   ├── track/    # 軌道相關
    │   │   │   ├── timeline/ # 時間軸相關
    │   │   │   └── ui/       # 通用 UI
    │   │   └── common/       # 通用組件
    │   ├── containers/       # 容器組件
    │   └── core/            # 表現層核心
    │       └── PixiManager.ts
    │
    ├── domain/               # 領域層
    │   ├── daw/             # DAW 領域
    │   │   ├── track/       # 軌道領域
    │   │   ├── timeline/    # 時間軸領域
    │   │   └── audio/       # 音頻領域
    │   └── core/            # 領域層核心
    │       └── DAWManager.ts
    │
    ├── data/                 # 數據層
    │   ├── repositories/     # 數據倉庫
    │   ├── models/          # 數據模型
    │   └── store/           # 狀態管理
    │
    ├── types/                # 類型定義
    ├── config/               # 配置文件
    ├── utils/                # 工具函數
    └── events/               # 事件系統
    ```

## 2. 事件系統設計

### 2.1 UI 事件層

    ```typescript
    // presentation/events/UIEventBus.ts
    export interface UIEventPayload {
        'ui:track:dragstart': { trackId: string; y: number };
        'ui:track:drag': { trackId: string; y: number };
        'ui:track:dragend': { trackId: string; y: number };
        'ui:track:contextmenu': { trackId: string; x: number; y: number };
        'ui:clip:dragstart': { clipId: string; x: number };
        'ui:clip:drag': { clipId: string; x: number };
        'ui:clip:dragend': { clipId: string; x: number };
    }
    ```

### 2.2 Domain 事件層

    ```typescript
    // domain/events/DomainEventBus.ts
    export interface DomainEventPayload {
        'domain:track:reordered': { trackId: string; newIndex: number };
        'domain:track:added': { track: Track };
        'domain:track:removed': { trackId: string };
        'domain:clip:moved': { clipId: string; newStartTime: number };
        'domain:clip:resized': { clipId: string; newDuration: number };
    }
    ```

## 3. 各層職責

### 3.1 表現層（Presentation Layer）

- 負責 UI 渲染和用戶交互
- 處理視覺效果和動畫
- 發送 UI 事件
- 監聽 Domain 事件並更新 UI
- 不包含業務邏輯

### 3.2 領域層（Domain Layer）

- 實現核心業務邏輯
- 處理數據驗證和轉換
- 發送 Domain 事件
- 監聽 UI 事件並轉換為 Domain 事件
- 不依賴於具體的 UI 實現

### 3.3 數據層（Data Layer）

- 管理數據持久化
- 提供數據訪問接口
- 實現數據模型
- 不包含業務邏輯

## 4. 重構步驟

### 4.1 第一階段：基礎架構

1. 創建新的目錄結構
2. 設置事件系統
3. 移動現有文件到對應目錄

### 4.2 第二階段：核心功能重構

1. 重構 Track 相關功能
2. 重構 Timeline 相關功能
3. 重構 Clip 相關功能

### 4.3 第三階段：優化和測試

1. 添加單元測試
2. 優化性能
3. 完善文檔

## 5. 開發規範

### 5.1 命名規範

- 表現層組件：`XXXComponent`
- 領域層服務：`XXXService`
- 數據層倉庫：`XXXRepository`
- UI 事件：`ui:xxx`
- Domain 事件：`domain:xxx`

### 5.2 代碼組織

- 每個組件一個文件
- 相關功能放在同一目錄
- 使用 index.ts 導出公共接口

### 5.3 事件處理

- UI 事件只處理視覺反饋
- Domain 事件處理業務邏輯
- 使用事件轉換器連接兩層

## 6. 示例代碼

### 6.1 表現層組件

    ```typescript
    class TrackComponent extends BaseComponent {
        constructor(
            private trackId: string,
            private trackService: TrackService,
            private uiEventBus: UIEventBus,
            private domainEventBus: DomainEventBus
        ) {
            super();
            this.setupEventHandlers();
        }
    }
    ```

### 6.2 領域層服務

    ```typescript
    class TrackService {
        constructor(
            private trackRepository: TrackRepository,
            private uiEventBus: UIEventBus,
            private domainEventBus: DomainEventBus
        ) {
            this.setupEventHandlers();
        }
    }
    ```

### 6.3 數據層倉庫

    ```typescript
    class TrackRepository {
        private tracks: Track[] = [];
        
        addTrack(track: Track): void {
            this.tracks.push(track);
        }
    }
    ```

## 7. 注意事項

1. 保持各層之間的鬆耦合
2. 使用依賴注入管理服務實例
3. 統一事件命名規範
4. 確保類型安全
5. 編寫完整的單元測試
