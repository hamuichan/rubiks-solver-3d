import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { CubeScene } from './CubeScene';
import { Face, RotationDirection } from '../core/types';

export interface CanvasViewHandle {
  rotateFace: (face: Face, direction: RotationDirection, durationMs?: number) => Promise<void>;
  resetCube: () => void;
  getIsRotating: () => boolean;
}

interface CanvasViewProps {
  onMoveExecuted?: (face: Face, direction: RotationDirection) => void;
}

export const CanvasView = forwardRef<CanvasViewHandle, CanvasViewProps>(
  ({ onMoveExecuted }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneInstanceRef = useRef<CubeScene | null>(null);

    const onMoveExecutedRef = useRef(onMoveExecuted);
    onMoveExecutedRef.current = onMoveExecuted;

    useImperativeHandle(ref, () => ({
      rotateFace: (face: Face, direction: RotationDirection, durationMs?: number) => {
        if (!sceneInstanceRef.current) return Promise.resolve();
        return sceneInstanceRef.current.rotateFace(face, direction, durationMs);
      },
      resetCube: () => {
        sceneInstanceRef.current?.resetCube();
      },
      getIsRotating: () => {
        return sceneInstanceRef.current?.getIsRotating() ?? false;
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const cubeScene = new CubeScene(container);
      sceneInstanceRef.current = cubeScene;

      cubeScene.setOnMove((face, direction) => {
        onMoveExecutedRef.current?.(face, direction);
      });

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          cubeScene.handleResize(width, height);
        }
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        cubeScene.destroy();
        sceneInstanceRef.current = null;
      };
    }, []);

    return (
      <div 
        ref={containerRef} 
        className="w-full h-full relative cursor-grab active:cursor-grabbing outline-none touch-none"
      />
    );
  }
);
