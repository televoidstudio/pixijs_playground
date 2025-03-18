import React, { useEffect, useRef } from 'react';
import { PixiManager } from '../pixi/PixiManager';
import { DAWManager } from './DAWManager';

const DAWContainer: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pixiManagerRef = useRef<PixiManager | null>(null);
    const dawManagerRef = useRef<DAWManager | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const initDAW = async () => {
            console.log("1. Starting DAW initialization");  // 檢查點 1
            
            pixiManagerRef.current = new PixiManager(containerRef.current!);
            await pixiManagerRef.current.init();
            
            if (pixiManagerRef.current?.app) {
                console.log("2. PixiManager initialized");  // 檢查點 2
                dawManagerRef.current = new DAWManager(pixiManagerRef.current.app);
                console.log("3. DAWManager created");      // 檢查點 3
                
                // 添加測試軌道
                console.log("Adding test tracks...");
                dawManagerRef.current.addTrack({
                    id: '1',
                    name: '音軌 1',
                    volume: 1,
                    isMuted: false,
                    isSolo: false,
                    color: 0x3a3a3a
                });

                dawManagerRef.current.addTrack({
                    id: '2',
                    name: '音軌 2',
                    volume: 1,
                    isMuted: false,
                    isSolo: false,
                    color: 0x4a4a4a
                });

                dawManagerRef.current.addTrack({
                    id: '3',
                    name: '音軌 3',
                    volume: 1,
                    isMuted: false,
                    isSolo: false,
                    color: 0x5a5a5a
                });

                // 直接添加一個測試 clip
                console.log("Adding test clip...");
                dawManagerRef.current.addClip({
                    id: 'test-clip-1',
                    trackId: '1',
                    startTime: 50,
                    duration: 200,
                    color: 0x4CAF50,
                    name: '測試片段'
                });
            }
        };

        initDAW().catch(console.error);  // 添加錯誤處理

        return () => {
            console.log("Cleaning up DAW");  // 檢查清理
            dawManagerRef.current?.destroy();
            pixiManagerRef.current?.destroy();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                backgroundColor: '#1a1a1a'
            }}
        />
    );
};

export default DAWContainer; 