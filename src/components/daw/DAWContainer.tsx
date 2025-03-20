import React, { useEffect, useRef } from 'react';
import { PixiManager } from '../pixi/PixiManager';
import { DAWManager } from './DAWManager';
import { useDAWSetup } from '../../hooks/useDAWSetup';

/**
 * DAW 容器組件
 * 負責初始化和管理 PIXI.js 應用程序和 DAW 管理器
 */
const DAWContainer: React.FC = () => {
    // 引用管理
    const containerRef = useRef<HTMLDivElement | null>(null);    // DOM 容器引用
    const pixiManagerRef = useRef<PixiManager | null>(null);     // PIXI 管理器引用
    const dawManagerRef = useRef<DAWManager | null>(null);       // DAW 管理器引用

    /**
     * 組件掛載和卸載的副作用
     * 負責初始化 PIXI 應用和 DAW 管理器，並在組件卸載時進行清理
     */
    useEffect(() => {
        if (!containerRef.current) return;

        /**
         * 初始化 DAW 的異步函數
         * 創建 PIXI 應用和 DAW 管理器，並添加測試數據
         */
        const initDAW = async () => {
            console.log("1. Starting DAW initialization");
            
            // 初始化 PIXI 管理器
            pixiManagerRef.current = new PixiManager(containerRef.current);
            await pixiManagerRef.current.init();
            
            // 如果 PIXI 應用創建成功，初始化 DAW 管理器
            if (pixiManagerRef.current?.app) {
                console.log("2. PixiManager initialized");
                dawManagerRef.current = new DAWManager(pixiManagerRef.current.app);
                console.log("3. DAWManager created");
                
                // 添加測試軌道
                console.log("Adding test tracks...");
                // 添加第一個測試軌道
                dawManagerRef.current.addTrack({
                    id: '1',
                    name: '音軌 1',
                    volume: 1,
                    isMuted: false,
                    isSolo: false,
                    color: 0x3a3a3a
                });

                // 添加第二個測試軌道
                dawManagerRef.current.addTrack({
                    id: '2',
                    name: '音軌 2',
                    volume: 1,
                    isMuted: false,
                    isSolo: false,
                    color: 0x4a4a4a
                });

                // 添加第三個測試軌道
                dawManagerRef.current.addTrack({
                    id: '3',
                    name: '音軌 3',
                    volume: 1,
                    isMuted: false,
                    isSolo: false,
                    color: 0x5a5a5a
                });

                // 添加測試片段
                console.log("Adding test clip...");
                dawManagerRef.current.addClip({
                    id: 'test-clip-1',
                    trackId: '1',
                    startTime: 1,
                    duration: 4,
                    color: 0x4CAF50,
                    name: '測試片段'
                });

                // 添加更多測試片段
                dawManagerRef.current.addClip({
                    id: 'test-clip-2',
                    trackId: '1',
                    startTime: 6,
                    duration: 3,
                    color: 0x2196F3,
                    name: '測試片段 2'
                });
            }
        };

        // 執行初始化並處理錯誤
        initDAW().catch(console.error);

        /**
         * 清理函數
         * 在組件卸載時銷毀 DAW 和 PIXI 管理器
         */
        return () => {
            console.log("Cleaning up DAW");
            dawManagerRef.current?.destroy();
            pixiManagerRef.current?.destroy();
        };
    }, []);

    /**
     * 處理右鍵點擊事件
     * 阻止瀏覽器默認的右鍵選單
     * @param event React 滑鼠事件
     */
    const handleContextMenu = (event: React.MouseEvent) => {
        event.preventDefault();
    };

    /**
     * 渲染 DAW 容器
     * 包含一個全屏的外層容器和一個內部的 PIXI 容器
     */
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                backgroundColor: '#1a1a1a'
            }}
            onContextMenu={handleContextMenu}
        >
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative"
                }}
                onContextMenu={handleContextMenu}
            />
        </div>
    );
};

export default DAWContainer; 