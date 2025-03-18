import React, { useEffect, useRef } from "react";
import { PixiManager } from "./PixiManager";
import { FloatingWindow } from "../window/FloatingWindow";
import { EventManager } from "../../utils/EventManager";

const PixiCanvas: React.FC = () => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const pixiManagerRef = useRef<PixiManager | null>(null);
    const eventManagerRef = useRef<EventManager>(EventManager.getInstance());

    useEffect(() => {
        if (!containerRef.current) return;

        if (!pixiManagerRef.current) {
            pixiManagerRef.current = new PixiManager(containerRef.current);
            pixiManagerRef.current.init().then(() => {
                // 建立兩個視窗作為示例
                new FloatingWindow(pixiManagerRef.current!.app!);
                new FloatingWindow(pixiManagerRef.current!.app!, 400, 250);
            });
        }

        const handleResize = () => {
            pixiManagerRef.current?.handleResize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener("resize", handleResize);

        return () => {
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