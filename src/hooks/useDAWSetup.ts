import { useEffect } from 'react';
import { DAWManager } from '../components/daw/DAWManager';

export const useDAWSetup = (dawManager: DAWManager | null) => {
    useEffect(() => {
        if (!dawManager) return;

        console.log("Setting up test clips...");

        requestAnimationFrame(() => {
            // 使用更小的數值，確保在可見範圍內
            dawManager.addClip({
                id: 'clip1',
                trackId: '1',
                startTime: 0,    // 從最左邊開始
                duration: 4,     // 較小的持續時間
                color: 0x4CAF50, // 亮綠色
                name: '片段 1'
            });

            dawManager.addClip({
                id: 'clip2',
                trackId: '1',
                startTime: 5,    // 稍微往右一點
                duration: 4,
                color: 0x2196F3, // 亮藍色
                name: '片段 2'
            });

            dawManager.addClip({
                id: 'clip3',
                trackId: '1',
                startTime: 4,    // 緊接在第二個後面
                duration: 2,
                color: 0xFF5722,
                name: '片段 3'
            });

            console.log("Test clips added with smaller values");
        });
    }, [dawManager]);
}; 