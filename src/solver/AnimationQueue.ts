import { Face, RotationDirection } from '../core/types';
import { parseMoveNotation } from '../core/scramble';
import { AnimationQueueListener, SolvePlan } from './types';

export type MoveExecutor = (
  face: Face,
  direction: RotationDirection,
  durationMs: number
) => Promise<void>;

export class AnimationQueue {
  private queue: string[] = [];
  private currentIndex = 0;
  private isProcessing = false;
  private isPaused = false;
  private speedMs = 250;
  private executor?: MoveExecutor;
  private listeners: AnimationQueueListener = {};
  private currentStepName?: string;

  constructor(speedMs: number = 250) {
    this.speedMs = speedMs;
  }

  public setExecutor(executor: MoveExecutor): void {
    this.executor = executor;
  }

  public setListeners(listeners: AnimationQueueListener): void {
    this.listeners = listeners;
  }

  public setSpeed(speedMs: number): void {
    this.speedMs = speedMs;
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public loadPlan(plan: SolvePlan): void {
    this.stop();
    this.queue = [...plan.totalMoves];
    this.currentIndex = 0;
  }

  public async start(): Promise<void> {
    if (this.isProcessing) return;
    if (this.queue.length === 0 || this.currentIndex >= this.queue.length) {
      this.listeners.onQueueComplete?.();
      return;
    }

    this.isProcessing = true;
    this.isPaused = false;
    this.listeners.onStateChange?.(true, false);

    await this.processNext();
  }

  public pause(): void {
    if (!this.isProcessing || this.isPaused) return;
    this.isPaused = true;
    this.listeners.onStateChange?.(true, true);
  }

  public resume(): void {
    if (!this.isProcessing || !this.isPaused) return;
    this.isPaused = false;
    this.listeners.onStateChange?.(true, false);
    this.processNext();
  }

  public stop(): void {
    this.isProcessing = false;
    this.isPaused = false;
    this.queue = [];
    this.currentIndex = 0;
    this.listeners.onStateChange?.(false, false);
  }

  // 큐를 즉시 폐기하고 진행 상태를 초기화
  public clear(): void {
    this.stop();
  }

  private async processNext(): Promise<void> {
    if (!this.isProcessing || this.isPaused) return;

    if (this.currentIndex >= this.queue.length) {
      this.isProcessing = false;
      this.isPaused = false;
      this.listeners.onStateChange?.(false, false);
      this.listeners.onQueueComplete?.();
      return;
    }

    const notation = this.queue[this.currentIndex];
    const { face, direction } = parseMoveNotation(notation);

    this.listeners.onMoveStart?.(
      notation,
      this.currentIndex,
      this.queue.length,
      this.currentStepName
    );

    if (this.executor) {
      await this.executor(face, direction, this.speedMs);
    }

    this.listeners.onMoveComplete?.(notation, this.currentIndex, this.queue.length);
    this.currentIndex++;

    // 다음 수 진행
    if (this.isProcessing && !this.isPaused) {
      await this.processNext();
    }
  }
}
