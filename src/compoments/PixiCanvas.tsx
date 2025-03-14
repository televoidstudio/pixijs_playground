import React, { useEffect, useRef } from "react";
import { PixiManager } from "./PixiManager";
import {FloatingWindow} from "./FloatingWindow.ts";

const PixiCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pixiManagerRef = useRef<PixiManager | null>(null);

    useEffect(() => {
        // 若 container 尚未準備好，就不做
        if (!containerRef.current) return;

        // 若 pixiManager 尚未創建，就初始化
        if (!pixiManagerRef.current) {
            pixiManagerRef.current = new PixiManager(containerRef.current);
            pixiManagerRef.current.init().then(()=>{
                new FloatingWindow(pixiManagerRef.current!.app!, 300, 200);

                // 也可以多建幾個
                new FloatingWindow(pixiManagerRef.current!.app!, 400, 250);
                }
            )
        }

        // 監聽視窗大小改變 → 調整 PixiJS 畫布大小
        const handleResize = () => {
            const manager = pixiManagerRef.current;
            if (manager?.app) {
                const w = window.innerWidth;
                const h = window.innerHeight;
                manager.app.renderer.resize(w, h);
                manager.app.canvas.style.width = `${w}px`;
                manager.app.canvas.style.height = `${h}px`;
            }
        };
        window.addEventListener("resize", handleResize);

        // 卸載時銷毀 PixiManager
        return () => {
            console.log("🔻 React 卸載，銷毀 PixiManager");
            pixiManagerRef.current?.destroy();
            pixiManagerRef.current = null;
            window.removeEventListener("resize", handleResize);
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
            }}
        />
    );
};

export default PixiCanvas;