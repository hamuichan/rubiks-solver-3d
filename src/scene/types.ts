import { Face, RotationDirection } from '../core/types';

export interface CubieCoordinate {
  x: number;
  y: number;
  z: number;
}

export interface AnimationOptions {
  durationMs: number;
  onComplete?: () => void;
}

export interface RotationRequest {
  face: Face;
  direction: RotationDirection;
  durationMs?: number;
}

export interface RaycastDragResult {
  face: Face;
  direction: RotationDirection;
  notation: string;
}
