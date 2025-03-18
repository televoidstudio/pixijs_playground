import { IWindowPosition } from '../../types/window';

export const clampPosition = (
    position: IWindowPosition,
    bounds: { width: number; height: number }
): IWindowPosition => ({
    x: Math.max(0, Math.min(position.x, bounds.width)),
    y: Math.max(0, Math.min(position.y, bounds.height))
}); 