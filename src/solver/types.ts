
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

export interface QueueTask {
  id: string;
  move: string;
  stepName?: string;
  onExecute?: () => void;
}
