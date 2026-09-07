export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

export type RotationDirection = 1 | -1 | 2; // 1: 시계 방향 90°, -1: 반시계 방향 90°, 2: 180° 회전

export interface Move {
  face: Face;
  direction: RotationDirection;
  notation: string;
}

export type ColorCode = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R';

export type CubeFacelets = ColorCode[];

export interface CubeStateModel {
  facelets: CubeFacelets;
  isSolved(): boolean;
  applyMove(move: Move | string): CubeStateModel;
  clone(): CubeStateModel;
}
