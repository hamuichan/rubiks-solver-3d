import { useState, useRef, useCallback, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { CanvasView, CanvasViewHandle } from './scene/CanvasView';
import { Face, RotationDirection } from './core/types';
import { CubeState } from './core/CubeState';
import { generateScramble, parseMoveNotation } from './core/scramble';
import { solveCube, initKociembaSolver } from './solver/solver';
import { AnimationQueue } from './solver/AnimationQueue';
import { Header } from './ui/Header';
import { FormulaHUD } from './ui/FormulaHUD';
import { StepGuide } from './ui/StepGuide';
import { ControlPanel } from './ui/ControlPanel';
import { ShortcutsModal } from './ui/ShortcutsModal';

export default function App() {
  const canvasRef = useRef<CanvasViewHandle>(null);
  const cubeStateRef = useRef<CubeState>(CubeState.fromSolved());
  const queueRef = useRef<AnimationQueue>(new AnimationQueue(250));

  const [speedMs, setSpeedMs] = useState(250);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [isSolved, setIsSolved] = useState(true);
  const [currentStep, setCurrentStep] = useState('큐브 준비 완료 (초기 솔브 상태)');
  const [formulaQueue, setFormulaQueue] = useState<string[]>([]);
  const [activeFormulaIdx, setActiveFormulaIdx] = useState<number>(-1);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  useEffect(() => {
    initKociembaSolver();
  }, []);

  useEffect(() => {
    const queue = queueRef.current;
    queue.setSpeed(speedMs);

    queue.setExecutor(async (face, direction, duration) => {
      let notation = face as string;
      if (direction === -1) notation = `${face}'`;
      else if (direction === 2) notation = `${face}2`;

      cubeStateRef.current.applyMove(notation);
      setIsSolved(cubeStateRef.current.isSolved());

      if (canvasRef.current) {
        await canvasRef.current.rotateFace(face, direction, duration);
      }
    });

    queue.setListeners({
      onMoveStart: (move, index, total) => {
        setActiveFormulaIdx(index);
        const progress = Math.round(((index + 1) / total) * 100);
        setCurrentStep(`자동 맞춤 진행 중: ${move} (${index + 1}/${total}) · ${progress}%`);
      },
      onQueueComplete: () => {
        setIsPlaying(false);
        setIsPaused(false);
        // 실제 54 Facelet 상태 모델의 엄격한 판별
        const actuallySolved = cubeStateRef.current.isSolved();
        setIsSolved(actuallySolved);

        if (actuallySolved) {
          setCurrentStep('자동 맞춤 완료! 큐브가 100% 복원되었습니다.');
        } else {
          setCurrentStep('복원 시퀀스 종료 (큐브가 아직 미완성 상태입니다. 다시 [자동 맞춤]을 실행하세요.)');
        }
      },
      onStateChange: (playing, paused) => {
        setIsPlaying(playing);
        setIsPaused(paused);
      },
    });
  }, [speedMs]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeedMs(newSpeed);
    queueRef.current.setSpeed(newSpeed);
  }, []);

  // 수동 회전 조작 (버튼 클릭)
  const handleManualRotate = useCallback(async (face: Face, direction: RotationDirection) => {
    if (!canvasRef.current || canvasRef.current.getIsRotating() || isScrambling) return;
    if (isPlaying && !isPaused) return;

    // 자동 맞춤 실행 또는 일시정지 중 수동 조작 시 기존 큐 무효화 및 리셋
    if (queueRef.current.getIsProcessing()) {
      queueRef.current.clear();
      setIsPlaying(false);
      setIsPaused(false);
      setFormulaQueue([]);
      setActiveFormulaIdx(-1);
    }

    let notation = face as string;
    if (direction === -1) notation = `${face}'`;
    else if (direction === 2) notation = `${face}2`;

    cubeStateRef.current.applyMove(notation);
    const solvedNow = cubeStateRef.current.isSolved();
    setIsSolved(solvedNow);

    setFormulaQueue((prev) => [...prev.slice(-9), notation]);
    setActiveFormulaIdx((prev) => Math.min(prev + 1, 9));
    setCurrentStep(
      isPaused
        ? `수동 조작으로 인해 자동 맞춤이 취소되었습니다 (${notation})`
        : `수동 회전: ${notation} (${solvedNow ? '솔브 완료' : '미완성'})`
    );

    await canvasRef.current.rotateFace(face, direction, speedMs);
  }, [speedMs, isScrambling, isPlaying, isPaused]);

  // 3D 마우스/터치 드래그에 의한 회전 완료 시
  const handleMoveExecuted = useCallback((face: Face, direction: RotationDirection) => {
    // 자동 맞춤 진행 또는 일시정지 중 마우스 드래그 발생 시 큐 즉시 폐기
    if (queueRef.current.getIsProcessing()) {
      queueRef.current.clear();
      setIsPlaying(false);
      setIsPaused(false);
      setFormulaQueue([]);
      setActiveFormulaIdx(-1);
    }

    const notation = direction === 1 ? face : `${face}'`;

    cubeStateRef.current.applyMove(notation);
    const solvedNow = cubeStateRef.current.isSolved();
    setIsSolved(solvedNow);

    setFormulaQueue((prev) => [...prev.slice(-9), notation]);
    setActiveFormulaIdx((prev) => Math.min(prev + 1, 9));
    setCurrentStep(
      isPaused
        ? `수동 조작으로 인해 자동 맞춤이 취소되었습니다 (${notation})`
        : `드래그 조작: ${notation} (${solvedNow ? '솔브 완료' : '미완성'})`
    );
  }, [isPaused]);

  const handleScramble = useCallback(async () => {
    if (!canvasRef.current || isScrambling || isPlaying || canvasRef.current.getIsRotating()) return;

    queueRef.current.stop();
    setIsScrambling(true);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStep('WCA 규격 무작위 섞기 진행 중...');

    const scrambleMoves = generateScramble(22);
    setFormulaQueue(scrambleMoves);
    setActiveFormulaIdx(0);

    const scrambleSpeed = Math.min(speedMs, 100);

    for (let i = 0; i < scrambleMoves.length; i++) {
      const move = scrambleMoves[i];
      setActiveFormulaIdx(i);

      const { face, direction } = parseMoveNotation(move);
      cubeStateRef.current.applyMove(move);

      await canvasRef.current.rotateFace(face, direction, scrambleSpeed);
    }

    const solvedNow = cubeStateRef.current.isSolved();
    setIsSolved(solvedNow);
    setIsScrambling(false);
    setCurrentStep('무작위 섞기 완료 (22수) - [자동 맞춤]을 눌러 복원하세요');
  }, [speedMs, isScrambling, isPlaying]);

  const handleAutoSolveToggle = useCallback(async () => {
    if (isScrambling) return;

    if (isPlaying) {
      if (isPaused) {
        queueRef.current.resume();
        setCurrentStep('자동 맞춤 재개');
      } else {
        queueRef.current.pause();
        setCurrentStep('자동 맞춤 일시정지됨');
      }
      return;
    }

    if (cubeStateRef.current.isSolved()) {
      setCurrentStep('큐브가 이미 복원된 상태입니다. 먼저 [섞기]를 실행하세요.');
      return;
    }

    setCurrentStep('Kociemba 2-Phase 최적 복원 경로 계산 중...');
    let plan;
    try {
      plan = solveCube(cubeStateRef.current);
    } catch {
      setCurrentStep('복원 경로 계산 중 오류가 발생했습니다. 큐브를 초기화한 후 다시 시도하세요.');
      return;
    }

    if (plan.totalMoves.length === 0) {
      if (plan.steps.length > 0 && plan.steps[0].stepId === 'solve_error') {
        setCurrentStep(`해법 도출 실패: ${plan.steps[0].description}`);
      } else {
        setCurrentStep('복원 불필요 (이미 완성됨)');
      }
      return;
    }

    setFormulaQueue(plan.totalMoves);
    setActiveFormulaIdx(0);
    setCurrentStep(`최적 해법 도출 (${plan.totalMoves.length}수) - 자동 복원 시작`);

    queueRef.current.loadPlan(plan);
    await queueRef.current.start();
  }, [isPlaying, isPaused, isScrambling]);

  const handleReset = useCallback(() => {
    if (isScrambling) return;

    queueRef.current.stop();
    canvasRef.current?.resetCube();
    cubeStateRef.current = CubeState.fromSolved();
    setIsSolved(true);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentStep('초기화 완료 (Solved 상태)');
    setFormulaQueue([]);
    setActiveFormulaIdx(-1);
  }, [isScrambling]);

  // 전역 키보드 단축키 (Space, S, R, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleAutoSolveToggle();
      } else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleScramble();
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'Escape') {
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAutoSolveToggle, handleScramble, handleReset]);

  const handleToggleShortcuts = useCallback(() => {
    setIsShortcutsOpen((prev) => !prev);
  }, []);

  const handleCloseShortcuts = useCallback(() => {
    setIsShortcutsOpen(false);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#181816] text-[#faf9f5] flex flex-col select-none overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#24221f] via-[#181816] to-[#121210] pointer-events-none opacity-80" />

      <Header
        isSolved={isSolved}
        onToggleShortcuts={handleToggleShortcuts}
      />

      <main className="relative flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 3D 뷰포트 영역 */}
        <section className="relative flex-1 min-h-[350px] lg:min-h-0 flex items-center justify-center overflow-hidden bg-[#141412]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#252320_1px,transparent_1px),linear-gradient(to_bottom,#252320_1px,transparent_1px)] bg-[size:52px_52px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

          <CanvasView ref={canvasRef} onMoveExecuted={handleMoveExecuted} />

          {/* 스마트 공식 HUD */}
          <FormulaHUD
            formulaQueue={formulaQueue}
            activeFormulaIdx={activeFormulaIdx}
            isScrambling={isScrambling}
            isPlaying={isPlaying}
            isPaused={isPaused}
          />
        </section>

        {/* 사이드 / 하단 컨트롤 패널 */}
        <aside className="w-full lg:w-80 xl:w-92 border-t lg:border-t-0 lg:border-l border-[#2d2a25] bg-[#1d1b18] p-4 lg:p-5 flex flex-col gap-4 overflow-y-auto z-10 max-h-[48vh] lg:max-h-none">
          <StepGuide
            currentStep={currentStep}
            isSolved={isSolved}
            isPlaying={isPlaying}
            activeFormulaIdx={activeFormulaIdx}
            totalMoves={formulaQueue.length}
          />

          <ControlPanel
            speedMs={speedMs}
            onSpeedChange={handleSpeedChange}
            isPlaying={isPlaying}
            isPaused={isPaused}
            isScrambling={isScrambling}
            onScramble={handleScramble}
            onAutoSolveToggle={handleAutoSolveToggle}
            onReset={handleReset}
            onManualRotate={handleManualRotate}
          />

          <div className="mt-auto pt-3 border-t border-[#2d2a25] text-[11px] text-[#8e8b82] flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#6a6761]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>단축키: Space / S / R</span>
            </div>
            <span className="text-[10px] font-mono text-[#8e8b82]">
              {isSolved ? 'Cube Solved' : 'Cube Unsolved'}
            </span>
          </div>
        </aside>
      </main>

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={handleCloseShortcuts}
      />
    </div>
  );
}
