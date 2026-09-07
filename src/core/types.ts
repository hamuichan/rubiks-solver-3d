export type Face = 'U' | 'D' | 'F' | 'B' | 'L' | 'R';

// 1: 시계 방향 90°, -1: 반시계 방향 90°, 2: 180° 회전
export type RotationDirection = 1 | -1 | 2;

export type ColorCode = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

// 54개 Facelet의 색상 배열 (WCA / Kociemba 표준 U-R-F-D-L-B 순서)
export type FaceletState = ColorCode[];

export interface Move {
  face: Face;
  direction: RotationDirection;
  notation: string;
}

export interface ICubeState {
  facelets: FaceletState;
  isSolved(): boolean;
  applyMove(notation: string): ICubeState;
  clone(): ICubeState;
  toKociembaString(): string;
}
