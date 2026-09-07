import { Face } from './types';

const FACES: Face[] = ['U', 'D', 'L', 'R', 'F', 'B'];
const MODIFIERS = ['', "'", '2'];

// 평행한 대향 면 축 그룹 (Y축: U/D, X축: L/R, Z축: F/B)
const AXIS_MAP: Record<Face, number> = {
  U: 0,
  D: 0,
  L: 1,
  R: 1,
  F: 2,
  B: 2,
};

export function generateScramble(length: number = 22): string[] {
  const sequence: string[] = [];
  let prevFace: Face | null = null;
  let secondPrevFace: Face | null = null;

  for (let i = 0; i < length; i++) {
    const availableFaces = FACES.filter((face) => {
      // 1. 직전 면과 동일한 면 회전 방지
      if (face === prevFace) return false;

      // 2. 평행 축 연속 상쇄 방지 (예: R L R' 방지)
      if (
        prevFace &&
        secondPrevFace &&
        AXIS_MAP[face] === AXIS_MAP[prevFace] &&
        AXIS_MAP[face] === AXIS_MAP[secondPrevFace]
      ) {
        return false;
      }

      return true;
    });

    const chosenFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const chosenModifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    sequence.push(`${chosenFace}${chosenModifier}`);
    secondPrevFace = prevFace;
    prevFace = chosenFace;
  }

  return sequence;
}

export function parseMoveNotation(notation: string): { face: Face; direction: 1 | -1 | 2 } {
  const clean = notation.trim();
  const face = clean[0].toUpperCase() as Face;
  let direction: 1 | -1 | 2 = 1;

  if (clean.includes("'")) {
    direction = -1;
  } else if (clean.includes('2')) {
    direction = 2;
  }

  return { face, direction };
}
