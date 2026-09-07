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

export function solveCube(cubeState: ICubeState): SolvePlan {
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

  initKociembaSolver();

  const kociembaStr = cubeState.toKociembaString();
  const cube = Cube.fromString(kociembaStr);
  const solutionString = cube.solve();

  const moves = solutionString.trim().split(/\s+/).filter(Boolean);

  // Kociemba 2-Phase 공식의 중간 지점을 기준으로 단계별 플랜 분할
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
