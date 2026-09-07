import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Box, 
  Shuffle, 
  Play, 
  Pause, 
  RotateCcw, 
  Compass,
  Sparkles,
  Layers,
  ChevronRight,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CanvasView, CanvasViewHandle } from './scene/CanvasView';
import { Face, RotationDirection } from './core/types';
import { CubeState } from './core/CubeState';
import { generateScramble, parseMoveNotation } from './core/scramble';
import { solveCube, initKociembaSolver } from './solver/solver';
import { AnimationQueue } from './solver/AnimationQueue';

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

  // Kociemba 솔버 탐색 테이블 초기화
  useEffect(() => {
    initKociembaSolver();
  }, []);

  // 애니메이션 큐 리스너 및 실행기 바인딩
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
        const solved = cubeStateRef.current.isSolved();
        setIsSolved(solved);
        setCurrentStep('자동 맞춤 완료! 큐브가 100% 복원되었습니다.');
      },
      onStateChange: (playing, paused) => {
        setIsPlaying(playing);
        setIsPaused(paused);
      },
    });
  }, [speedMs]);

  // 속도 조절 반영
  const handleSpeedChange = (newSpeed: number) => {
    setSpeedMs(newSpeed);
    queueRef.current.setSpeed(newSpeed);
  };

  // 수동 버튼 회전 (Singmaster 표기법)
  const handleManualRotate = useCallback(async (face: Face, direction: RotationDirection) => {
    if (!canvasRef.current || canvasRef.current.getIsRotating() || isScrambling || isPlaying) return;

    let notation = face as string;
    if (direction === -1) notation = `${face}'`;
    else if (direction === 2) notation = `${face}2`;

    cubeStateRef.current.applyMove(notation);
    const solvedNow = cubeStateRef.current.isSolved();
    setIsSolved(solvedNow);

    setFormulaQueue((prev) => [...prev.slice(-9), notation]);
    setActiveFormulaIdx((prev) => Math.min(prev + 1, 9));
    setCurrentStep(`수동 회전: ${notation} (${solvedNow ? '솔브 완료' : '미완성'})`);

    await canvasRef.current.rotateFace(face, direction, speedMs);
  }, [speedMs, isScrambling, isPlaying]);

  // 3D 마우스/터치 드래그에 의한 회전 완료 시 논리 상태 동기화
  const handleMoveExecuted = useCallback((face: Face, direction: RotationDirection) => {
    if (isPlaying) return;

    const notation = direction === 1 ? face : `${face}'`;

    cubeStateRef.current.applyMove(notation);
    const solvedNow = cubeStateRef.current.isSolved();
    setIsSolved(solvedNow);

    setFormulaQueue((prev) => [...prev.slice(-9), notation]);
    setActiveFormulaIdx((prev) => Math.min(prev + 1, 9));
    setCurrentStep(`드래그 조작: ${notation} (${solvedNow ? '솔브 완료' : '미완성'})`);
  }, [isPlaying]);

  // WCA 규격 무작위 섞기 (Scramble)
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

  // 자동 맞춤 (Auto Solve) 및 일시정지/재개 제어
  const handleAutoSolveToggle = useCallback(async () => {
    if (isScrambling) return;

    // 이미 실행 중일 때: 일시정지 / 재개 토글
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

    // 이미 맞춰진 상태인 경우
    if (cubeStateRef.current.isSolved()) {
      setCurrentStep('큐브가 이미 복원된 상태입니다. 먼저 [섞기]를 실행하세요.');
      return;
    }

    // 솔버 엔진을 통한 복원 플랜 도출
    setCurrentStep('Kociemba 2-Phase 최적 복원 경로 계산 중...');
    const plan = solveCube(cubeStateRef.current);

    if (plan.totalMoves.length === 0) {
      setCurrentStep('복원 불필요 (이미 완성됨)');
      return;
    }

    setFormulaQueue(plan.totalMoves);
    setActiveFormulaIdx(0);
    setCurrentStep(`최적 해법 도출 (${plan.totalMoves.length}수) - 자동 복원 시작`);

    queueRef.current.loadPlan(plan);
    await queueRef.current.start();
  }, [isPlaying, isPaused, isScrambling]);

  // 큐브 및 상태 원위치 리셋
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

  return (
    <div className="relative w-screen h-screen bg-[#181715] text-[#f4f3ef] flex flex-col select-none overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#24211d] via-[#181715] to-[#121110] pointer-events-none opacity-80" />

      {/* 상단 네비게이션 헤더 */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-[#2d2a25] bg-[#1d1b18]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
            <Box className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-semibold tracking-tight text-[#f4f3ef] font-serif-claude italic">
              Rubik's Solver
            </h1>
            <span className="text-xs text-[#8e8b82] font-normal">3D Intelligent Visualizer</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* 논리 큐브 상태 인디케이터 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#24221e] border border-[#35322c]">
            {isSolved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">SOLVED</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-[#cc785c]" />
                <span className="text-[#cc785c] font-medium">SCRAMBLED</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#24221e] border border-[#35322c] text-[#8e8b82]">
            <Compass className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>Kociemba 2-Phase Engine</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#e09075] border border-[#cc785c]/25 font-mono">
            Phase 4
          </span>
        </div>
      </header>

      {/* 메인 뷰포트 & 사이드바 */}
      <main className="relative flex-1 flex overflow-hidden">
        {/* 3D Three.js 뷰포트 영역 */}
        <section className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#141311]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#24211d_1px,transparent_1px),linear-gradient(to_bottom,#24211d_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

          <CanvasView ref={canvasRef} onMoveExecuted={handleMoveExecuted} />

          {/* Singmaster 회전 공식 HUD 오버레이 */}
          {formulaQueue.length > 0 && (
            <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-[500px] p-4 rounded-xl bg-[#201e1b]/95 border border-[#35322c] shadow-xl backdrop-blur-md z-10 pointer-events-auto">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#dedcd5]">
                  <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>
                    {isScrambling 
                      ? 'WCA 스크램블 진행 중...' 
                      : isPlaying 
                      ? '자동 맞춤 복원 시퀀스 실행 중' 
                      : '회전 공식 시퀀스 (Singmaster)'}
                  </span>
                </div>
                <span className="text-[10px] text-[#8e8b82] font-mono">
                  {Math.max(0, activeFormulaIdx + 1)} / {formulaQueue.length} Moves
                </span>
              </div>

              {/* 공식 티커 */}
              <div className="flex items-center gap-1.5 py-1 overflow-x-auto">
                {formulaQueue.map((move, idx) => {
                  const isActive = idx === activeFormulaIdx;
                  const isDone = idx < activeFormulaIdx;
                  return (
                    <div
                      key={idx}
                      className={`min-w-[38px] h-[38px] flex items-center justify-center font-mono text-xs font-semibold rounded-lg border transition-all duration-150 ${
                        isActive
                          ? 'bg-[#cc785c] text-white border-[#cc785c] shadow-md scale-105'
                          : isDone
                          ? 'bg-[#181715] text-[#625f58] border-[#2a2823]'
                          : 'bg-[#282522] text-[#b5b3ad] border-[#38352f]'
                      }`}
                    >
                      {move}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#2d2a25] flex items-center justify-between text-[11px] text-[#8e8b82]">
                <div className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-[#cc785c]" />
                  <span>
                    현재 수: <strong className="text-[#f4f3ef] font-mono">{formulaQueue[activeFormulaIdx] || '-'}</strong>
                  </span>
                </div>
                <span>
                  {isPlaying 
                    ? isPaused ? '일시정지됨' : '순차 복원 중...' 
                    : isScrambling 
                    ? '스크램블 중...' 
                    : '마우스 드래그 / 키패드로 조작'}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* 우측 컨트롤 사이드바 */}
        <aside className="w-80 md:w-88 border-l border-[#2d2a25] bg-[#1d1b18] p-5 flex flex-col gap-5 overflow-y-auto z-10">
          {/* 해법 단계 안내 카드 */}
          <div className="p-4 rounded-xl bg-[#23211e] border border-[#35322c]">
            <div className="flex items-center gap-2 text-[#cc785c] mb-2">
              <Layers className="w-4 h-4" />
              <h2 className="text-xs font-semibold text-[#dedcd5]">해법 진행 상태</h2>
            </div>
            <div className="p-3 rounded-lg bg-[#181715] border border-[#2d2a25] text-xs leading-relaxed">
              <p className="font-medium text-[#f4f3ef] mb-1">{currentStep}</p>
              <p className="text-[#8e8b82] text-[11px]">
                {isSolved 
                  ? '큐브가 모두 맞춰진 상태입니다. [섞기]를 눌러 큐브를 섞어보세요.'
                  : isPlaying
                  ? 'Kociemba 2-Phase 알고리즘이 실시간으로 3D 큐브를 복원하고 있습니다.'
                  : '큐브가 섞여 있습니다. [자동 맞춤]을 누르면 즉시 복원 공식이 계산되어 실행됩니다.'}
              </p>
            </div>
          </div>

          {/* 메인 제어 액션 */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold tracking-wide uppercase text-[#8e8b82]">제어</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                disabled={isScrambling || isPlaying}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#282522] hover:bg-[#302d29] disabled:opacity-50 text-[#dedcd5] text-xs font-medium border border-[#3a3731] transition active:scale-[0.98]"
                onClick={handleScramble}
              >
                <Shuffle className={`w-3.5 h-3.5 text-[#cc785c] ${isScrambling ? 'animate-spin' : ''}`} />
                {isScrambling ? '섞는 중...' : '섞기 (Scramble)'}
              </button>

              <button 
                disabled={isScrambling}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-white text-xs font-medium shadow-sm transition active:scale-[0.98] ${
                  isPlaying 
                    ? isPaused ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'
                    : 'bg-[#cc785c] hover:bg-[#ba674d]'
                }`}
                onClick={handleAutoSolveToggle}
              >
                {isPlaying ? (
                  isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      재개 (Resume)
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      일시정지
                    </>
                  )
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    자동 맞춤
                  </>
                )}
              </button>
            </div>

            <button 
              disabled={isScrambling}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-transparent hover:bg-[#282522] disabled:opacity-50 text-[#8e8b82] hover:text-[#dedcd5] text-xs border border-[#2d2a25] transition"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              큐브 원위치 리셋
            </button>
          </div>

          {/* 속도 조절 슬라이더 */}
          <div className="p-3.5 rounded-xl bg-[#23211e] border border-[#35322c] flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#dedcd5]">
                <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
                <span className="font-medium">회전 속도</span>
              </div>
              <span className="font-mono text-[#cc785c] text-xs font-semibold">{speedMs}ms</span>
            </div>
            <input
              type="range"
              min={60}
              max={800}
              step={20}
              value={speedMs}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="w-full h-1.5 bg-[#181715] rounded-lg appearance-none cursor-pointer accent-[#cc785c]"
            />
            <div className="flex justify-between text-[10px] text-[#8e8b82]">
              <span>초고속 (60ms)</span>
              <span>표준 (250ms)</span>
              <span>슬로우 (800ms)</span>
            </div>
          </div>

          {/* 수동 회전 조작 키패드 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold tracking-wide uppercase text-[#8e8b82]">수동 회전 조작</h3>
              <span className="text-[10px] text-[#625f58]">Singmaster</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
              {(['U', 'D', 'L', 'R', 'F', 'B'] as Face[]).map((face) => (
                <div key={face} className="flex gap-1">
                  <button 
                    disabled={isScrambling || isPlaying}
                    onClick={() => handleManualRotate(face, 1)}
                    className="flex-1 py-1.5 rounded-md bg-[#24221e] hover:bg-[#2d2a25] disabled:opacity-50 text-[#dedcd5] font-medium border border-[#35322c] transition active:scale-95"
                    title={`${face} 시계방향 90도`}
                  >
                    {face}
                  </button>
                  <button 
                    disabled={isScrambling || isPlaying}
                    onClick={() => handleManualRotate(face, -1)}
                    className="flex-1 py-1.5 rounded-md bg-[#1d1b18] hover:bg-[#282522] disabled:opacity-50 text-[#cc785c] font-medium border border-[#35322c] transition active:scale-95"
                    title={`${face}' 반시계방향 90도`}
                  >
                    {face}'
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 하단 동기화 상태 */}
          <div className="mt-auto pt-3 border-t border-[#2d2a25] text-[11px] text-[#8e8b82] flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#625f58]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>솔버 큐 엔진</span>
            </div>
            <span className="text-[10px] font-mono text-[#8e8b82]">
              {isPlaying ? (isPaused ? 'Queue Paused' : 'Queue Running') : 'Queue Idle'}
            </span>
          </div>
        </aside>
      </main>
    </div>
  );
}
