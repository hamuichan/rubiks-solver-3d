import { describe, it, expect } from 'vitest';
import { CubeState } from './CubeState';
import { SOLVED_KOCIEMBA_STRING } from './constants';

describe('CubeState (54 Facelets Logical State Model)', () => {
  it('초기 생성 시 54개의 모든 Facelet이 올바른 솔브 상태여야 한다', () => {
    const cube = CubeState.fromSolved();

    expect(cube.isSolved()).toBe(true);
    expect(cube.toKociembaString()).toBe(SOLVED_KOCIEMBA_STRING);
    expect(cube.facelets.length).toBe(54);
  });

  it('U 회전 시 인접한 F, L, B, R 면의 상단 행 Facelet들이 시계방향으로 치환되어야 한다', () => {
    const cube = CubeState.fromSolved();
    cube.applyMove('U');

    expect(cube.isSolved()).toBe(false);
    expect(cube.facelets[4]).toBe('U');
  });

  it('기본 6개 면 회전이 Kociemba 표준 문자열과 100% 일치해야 한다', async () => {
    const { default: Cube } = await import('cubejs');
    const faces = ['U', 'R', 'F', 'D', 'L', 'B'];

    for (const f of faces) {
      const ourCube = CubeState.fromSolved();
      ourCube.applyMove(f);

      const refCube = new Cube();
      refCube.move(f);

      expect(ourCube.toKociembaString(), `불일치 면: ${f}`).toBe(refCube.asString());
    }
  });

  it('동일한 단일 면 회전을 4번 반복하면 항등원(원상태)으로 복구되어야 한다', () => {
    const moves = ['U', 'D', 'L', 'R', 'F', 'B'];

    for (const move of moves) {
      const cube = CubeState.fromSolved();
      cube.applyMove(move);
      cube.applyMove(move);
      cube.applyMove(move);
      cube.applyMove(move);

      expect(cube.isSolved(), `${move} 4회 회전 후 솔브 상태 불일치`).toBe(true);
      expect(cube.toKociembaString()).toBe(SOLVED_KOCIEMBA_STRING);
    }
  });

  it('반대 방향 회전(Prime)은 정방향 회전을 상쇄해야 한다', () => {
    const pairs = [
      ['R', "R'"],
      ['U', "U'"],
      ['F', "F'"],
      ['D', "D'"],
      ['L', "L'"],
      ['B', "B'"],
    ];

    for (const [fwd, rev] of pairs) {
      const cube = CubeState.fromSolved();
      cube.applyMove(fwd);
      expect(cube.isSolved()).toBe(false);
      cube.applyMove(rev);
      expect(cube.isSolved(), `${fwd} 후 ${rev} 적용 시 복원 실패`).toBe(true);
    }
  });

  it('섹시 무브 (R U R\' U\') 6회 반복 시 정확히 원상복구되어야 한다', () => {
    const cube = CubeState.fromSolved();
    const sexyMove = ['R', 'U', "R'", "U'"];

    for (let i = 0; i < 6; i++) {
      for (const m of sexyMove) {
        cube.applyMove(m);
      }
    }

    expect(cube.isSolved()).toBe(true);
    expect(cube.toKociembaString()).toBe(SOLVED_KOCIEMBA_STRING);
  });
});
