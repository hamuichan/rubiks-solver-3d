import { describe, it, expect } from 'vitest';
import { generateScramble, parseMoveNotation } from './scramble';

describe('WCA Scramble Generator', () => {
  it('지정된 길이의 스크램블 수열을 생성해야 한다', () => {
    const scramble20 = generateScramble(20);
    const scramble25 = generateScramble(25);

    expect(scramble20.length).toBe(20);
    expect(scramble25.length).toBe(25);
  });

  it('연속으로 동일한 면이 나오지 않아야 한다', () => {
    for (let test = 0; test < 50; test++) {
      const scramble = generateScramble(25);
      for (let i = 1; i < scramble.length; i++) {
        const prevFace = scramble[i - 1][0];
        const currentFace = scramble[i][0];
        expect(currentFace).not.toBe(prevFace);
      }
    }
  });

  it('동일 축의 평행한 면이 3연속으로 나오지 않아야 한다', () => {
    const AXIS: Record<string, number> = {
      U: 0, D: 0,
      L: 1, R: 1,
      F: 2, B: 2,
    };

    for (let test = 0; test < 50; test++) {
      const scramble = generateScramble(25);
      for (let i = 2; i < scramble.length; i++) {
        const a = AXIS[scramble[i - 2][0]];
        const b = AXIS[scramble[i - 1][0]];
        const c = AXIS[scramble[i][0]];

        const allSameAxis = a === b && b === c;
        expect(allSameAxis, `축 상쇄 발생: ${scramble.slice(i - 2, i + 1).join(' ')}`).toBe(false);
      }
    }
  });

  it('parseMoveNotation이 Singmaster 표기법을 face와 direction으로 정확히 파싱해야 한다', () => {
    expect(parseMoveNotation('R')).toEqual({ face: 'R', direction: 1 });
    expect(parseMoveNotation("U'")).toEqual({ face: 'U', direction: -1 });
    expect(parseMoveNotation('F2')).toEqual({ face: 'F', direction: 2 });
    expect(parseMoveNotation("L' ")).toEqual({ face: 'L', direction: -1 });
  });
});
