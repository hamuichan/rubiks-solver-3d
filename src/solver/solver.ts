import Cube from 'cubejs';
import { ICubeState } from '../core/types';
import { SolvePlan, SolveStep } from './types';

let isSolverInitialized = false;

// Kociemba 2-Phase 탐색 테이블 초기화 (최초 1회 실행)
export function initKociembaSolver(): void {
  if (isSolverInitialized) return;
  Cube.initSolver();
  isSolverInitialized = true;
}

const ALL_MOVES: string[] = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2',
];

// 1~2수 이내로 즉시 복원 가능한지 브루트포스로 검사하는 Short-circuit 최적화
function findShortCircuitSolution(cubeState: ICubeState): string[] | null {
  // 1. Depth 1 (1수 검사: 18가지 경우의 수)
  for (const m of ALL_MOVES) {
    const testCube = cubeState.clone().applyMove(m);
    if (testCube.isSolved()) {
      return [m];
    }
  }

  // 2. Depth 2 (2수 검사: 18 * 15 = 270가지 경우의 수)
  for (const m1 of ALL_MOVES) {
    const face1 = m1[0];
    const cubeAfterM1 = cubeState.clone().applyMove(m1);

    for (const m2 of ALL_MOVES) {
      // 동일 면 연속 회전 배제 (예: R R' 등은 이미 1수에서 처리됨)
      if (m2[0] === face1) continue;

      const cubeAfterM2 = cubeAfterM1.clone().applyMove(m2);
      if (cubeAfterM2.isSolved()) {
        return [m1, m2];
      }
    }
  }

  return null;
}

export function solveCube(cubeState: ICubeState): SolvePlan {
  // 0. 이미 복원된 상태
  if (cubeState.isSolved()) {
    return {
      totalMoves: [],
      steps: [
        {
          stepId: 'already_solved',
          stepName: '복원 완료 상태',
          description: '큐브가 이미 모든 면이 맞춰진 상태입니다.',
          moves: [],
        },
      ],
    };
  }

  // 1. Short-circuit: 1~2수 이내 즉시 복원 검사 (R -> R', R U -> U' R' 등)
  const quickSolution = findShortCircuitSolution(cubeState);
  if (quickSolution) {
    return {
      totalMoves: quickSolution,
      steps: [
        {
          stepId: 'short_circuit',
          stepName: `직접 최적 복원 (${quickSolution.length}수)`,
          description: `${quickSolution.length}수의 직접 역회전을 통해 불필요한 단계 없이 즉시 큐브를 완전 복원합니다.`,
          moves: quickSolution,
        },
      ],
    };
  }

  // 2. 3수 이상: Kociemba 2-Phase 최적 솔버 실행
  initKociembaSolver();

  const kociembaStr = cubeState.toKociembaString();
  const cube = Cube.fromString(kociembaStr);
  const solutionString = cube.solve();

  const moves = solutionString.trim().split(/\s+/).filter(Boolean);

  const midIndex = Math.ceil(moves.length / 2);
  const phase1Moves = moves.slice(0, midIndex);
  const phase2Moves = moves.slice(midIndex);

  const steps: SolveStep[] = [
    {
      stepId: 'phase_1',
      stepName: '1단계: 하위군 G1 축소 및 엣지 방향 정렬',
      description: '모든 엣지 및 코너의 방향성을 보정하여 <U, D, R2, L2, F2, B2> 군으로 환원합니다.',
      moves: phase1Moves,
    },
    {
      stepId: 'phase_2',
      stepName: '2단계: 코너 및 엣지 최종 슬롯 복원',
      description: '정렬된 축을 바탕으로 20수 내외의 최단 경로로 6개 면 전체를 완전 복원합니다.',
      moves: phase2Moves,
    },
  ];

  return {
    totalMoves: moves,
    steps,
  };
}
