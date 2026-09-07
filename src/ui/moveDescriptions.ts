export const MOVE_DESCRIPTIONS: Record<string, string> = {
  U: '상단(Up) 시계방향 90°',
  "U'": '상단(Up) 반시계방향 90°',
  U2: '상단(Up) 180° 반전',
  D: '하단(Down) 시계방향 90°',
  "D'": '하단(Down) 반시계방향 90°',
  D2: '하단(Down) 180° 반전',
  L: '좌측(Left) 시계방향 90°',
  "L'": '좌측(Left) 반시계방향 90°',
  L2: '좌측(Left) 180° 반전',
  R: '우측(Right) 시계방향 90°',
  "R'": '우측(Right) 반시계방향 90°',
  R2: '우측(Right) 180° 반전',
  F: '전면(Front) 시계방향 90°',
  "F'": '전면(Front) 반시계방향 90°',
  F2: '전면(Front) 180° 반전',
  B: '후면(Back) 시계방향 90°',
  "B'": '후면(Back) 반시계방향 90°',
  B2: '후면(Back) 180° 반전',
};

export function getMoveDescription(notation: string): string {
  return MOVE_DESCRIPTIONS[notation.trim()] || `${notation} 회전`;
}
