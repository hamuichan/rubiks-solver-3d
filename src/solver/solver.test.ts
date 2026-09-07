import { describe, it, expect, beforeAll } from 'vitest';
import { CubeState } from '../core/CubeState';
import { generateScramble } from '../core/scramble';
import { solveCube, initKociembaSolver } from './solver';
import { AnimationQueue } from './AnimationQueue';

describe('SolverEngine & AnimationQueue Verification', () => {
  beforeAll(() => {
    initKociembaSolver();
  }, 10000);

  it('이미 복원된 큐브에 대해서는 빈 무브 플랜을 반환해야 한다', () => {
    const cube = CubeState.fromSolved();
    const plan = solveCube(cube);

    expect(plan.totalMoves.length).toBe(0);
    expect(plan.steps[0].stepId).toBe('already_solved');
  });

  it('R 1번 회전된 상태에서는 Short-circuit 최적화로 정확히 R\' 1수만 반환해야 한다', () => {
    const cube = CubeState.fromSolved();
    cube.applyMove('R');

    const plan = solveCube(cube);
    expect(plan.totalMoves).toEqual(["R'"]);
    expect(plan.steps[0].stepId).toBe('short_circuit');

    cube.applyMove(plan.totalMoves[0]);
    expect(cube.isSolved()).toBe(true);
  });

  it('R U 2번 회전된 상태에서는 Short-circuit 최적화로 정확히 U\' R\' 2수만 반환해야 한다', () => {
    const cube = CubeState.fromSolved();
    cube.applyMove('R');
    cube.applyMove('U');

    const plan = solveCube(cube);
    expect(plan.totalMoves).toEqual(["U'", "R'"]);
    expect(plan.steps[0].stepId).toBe('short_circuit');

    for (const m of plan.totalMoves) {
      cube.applyMove(m);
    }
    expect(cube.isSolved()).toBe(true);
  });

  it('간단한 회전 수열로 섞인 큐브를 100% 복원해야 한다', () => {
    const cube = CubeState.fromSolved();
    cube.applyMove('R');
    cube.applyMove('U');
    cube.applyMove("R'");
    cube.applyMove("U'");

    expect(cube.isSolved()).toBe(false);

    const plan = solveCube(cube);
    expect(plan.totalMoves.length).toBeGreaterThan(0);

    for (const move of plan.totalMoves) {
      cube.applyMove(move);
    }

    expect(cube.isSolved()).toBe(true);
  });

  it('임의의 WCA 22수 스크램블 5회에 대해 도출된 공식 적용 시 100% SOLVED로 복원되어야 한다', () => {
    for (let testIdx = 1; testIdx <= 5; testIdx++) {
      const cube = CubeState.fromSolved();
      const scramble = generateScramble(22);

      for (const m of scramble) {
        cube.applyMove(m);
      }

      expect(cube.isSolved(), `스크램블 #${testIdx} 섞기 실패`).toBe(false);

      const plan = solveCube(cube);
      expect(plan.totalMoves.length).toBeGreaterThan(0);
      expect(plan.steps.length).toBe(2);

      // 도출된 솔루션을 큐브에 순차 적용
      for (const move of plan.totalMoves) {
        cube.applyMove(move);
      }

      expect(cube.isSolved(), `스크램블 #${testIdx} 복원 실패 (공식: ${plan.totalMoves.join(' ')})`).toBe(true);
    }
  });

  it('AnimationQueue가 순차적으로 비동기 실행 및 완료 이벤트를 호출해야 한다', async () => {
    const executedMoves: string[] = [];
    const queue = new AnimationQueue(10);

    queue.setExecutor(async (face, dir) => {
      executedMoves.push(dir === 1 ? face : `${face}'`);
    });

    const isDone = new Promise<void>((resolve) => {
      queue.setListeners({
        onQueueComplete: () => resolve(),
      });
    });

    queue.loadPlan({
      totalMoves: ['R', 'U', "R'"],
      steps: [],
    });

    await queue.start();
    await isDone;

    expect(executedMoves).toEqual(['R', 'U', "R'"]);
    expect(queue.getIsProcessing()).toBe(false);
  });

  it('일시정지 중 clear() 호출 시 잔여 큐가 즉시 폐기되고 진행 상태가 초기화되어야 한다', async () => {
    const executedMoves: string[] = [];
    const queue = new AnimationQueue(30);

    queue.setExecutor(async (face, dir) => {
      executedMoves.push(dir === 1 ? face : `${face}'`);
      // 첫 번째 수 실행 후 일시정지
      queue.pause();
    });

    queue.loadPlan({
      totalMoves: ['R', 'U', "R'", "U'"],
      steps: [],
    });

    await queue.start();

    expect(queue.getIsPaused()).toBe(true);
    expect(executedMoves.length).toBe(1);

    // 수동 조작으로 인한 큐 무효화 트리거
    queue.clear();

    expect(queue.getIsProcessing()).toBe(false);
    expect(queue.getIsPaused()).toBe(false);

    // clear 후에는 더 이상 큐가 진행되지 않음
    expect(executedMoves.length).toBe(1);
  });

  it('도중에 외부 개입으로 큐브 상태가 틀어진 경우 실제 CubeState.isSolved()는 엄격하게 false여야 한다', () => {
    const cube = CubeState.fromSolved();
    cube.applyMove('R');
    cube.applyMove('U');

    // 잘못된 공식 수열을 적용했을 때
    cube.applyMove('D'); // 전혀 다른 수 개입

    expect(cube.isSolved()).toBe(false);
  });
});
