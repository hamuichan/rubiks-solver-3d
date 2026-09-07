export interface SolveStep {
  stepId: string;
  stepName: string;
  description: string;
  moves: string[];
}

export interface SolvePlan {
  totalMoves: string[];
  steps: SolveStep[];
}

export interface AnimationQueueListener {
  onMoveStart?: (move: string, index: number, total: number, stepName?: string) => void;
  onMoveComplete?: (move: string, index: number, total: number) => void;
  onQueueComplete?: () => void;
  onStateChange?: (isPlaying: boolean, isPaused: boolean) => void;
}
