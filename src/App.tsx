import { useState, useRef, useCallback } from 'react';
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
  Clock
} from 'lucide-react';
import { CanvasView, CanvasViewHandle } from './scene/CanvasView';
import { Face, RotationDirection } from './core/types';

export default function App() {
  const canvasRef = useRef<CanvasViewHandle>(null);
  const [speedMs, setSpeedMs] = useState(250);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState('큐브 준비 완료 (드래그 또는 버튼으로 조작 가능)');
  const [formulaQueue, setFormulaQueue] = useState<string[]>(['R', 'U', "R'", "U'"]);
  const [activeFormulaIdx, setActiveFormulaIdx] = useState<number>(0);

  // 사용자 수동 버튼 조작 핸들러
  const handleManualRotate = useCallback(async (face: Face, direction: RotationDirection) => {
    if (!canvasRef.current || canvasRef.current.getIsRotating()) return;

    const notation = direction === 1 ? face : `${face}'`;
    setFormulaQueue((prev) => [...prev.slice(-7), notation]);
    setActiveFormulaIdx((prev) => Math.min(prev + 1, 7));

    await canvasRef.current.rotateFace(face, direction, speedMs);
  }, [speedMs]);

  // 마우스/터치 드래그에 의한 3D 회전 완료 콜백
  const handleMoveExecuted = useCallback((face: Face, direction: RotationDirection) => {
    const notation = direction === 1 ? face : `${face}'`;
    setFormulaQueue((prev) => [...prev.slice(-7), notation]);
    setActiveFormulaIdx((prev) => Math.min(prev + 1, 7));
    setCurrentStep(`수동 회전: ${notation}`);
  }, []);

  const handleReset = useCallback(() => {
    canvasRef.current?.resetCube();
    setIsPlaying(false);
    setCurrentStep('초기화 완료 (Solved)');
    setFormulaQueue([]);
    setActiveFormulaIdx(-1);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#181715] text-[#f4f3ef] flex flex-col select-none overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#24211d] via-[#181715] to-[#121110] pointer-events-none opacity-80" />

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

        <div className="flex items-center gap-3 text-xs text-[#8e8b82]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#24221e] border border-[#35322c]">
            <Compass className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>Optimal 2-Phase Engine</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#e09075] border border-[#cc785c]/25 font-mono">
            Phase 2
          </span>
        </div>
      </header>

      <main className="relative flex-1 flex overflow-hidden">
        {/* 3D Three.js 뷰포트 영역 */}
        <section className="relative flex-1 flex items-center justify-center overflow-hidden bg-[#141311]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#24211d_1px,transparent_1px),linear-gradient(to_bottom,#24211d_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

          <CanvasView ref={canvasRef} onMoveExecuted={handleMoveExecuted} />

          {/* Singmaster 회전 공식 HUD 오버레이 */}
          {formulaQueue.length > 0 && (
            <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-[460px] p-4 rounded-xl bg-[#201e1b]/95 border border-[#35322c] shadow-xl backdrop-blur-md z-10 pointer-events-auto">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#dedcd5]">
                  <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
                  <span>회전 공식 시퀀스 (Singmaster)</span>
                </div>
                <span className="text-[10px] text-[#8e8b82] font-mono">
                  {formulaQueue.length} Moves
                </span>
              </div>

              <div className="flex items-center gap-1.5 py-1 overflow-x-auto">
                {formulaQueue.map((move, idx) => {
                  const isActive = idx === activeFormulaIdx;
                  return (
                    <div
                      key={idx}
                      className={`min-w-[38px] h-[38px] flex items-center justify-center font-mono text-xs font-semibold rounded-lg border transition-all duration-200 ${
                        isActive
                          ? 'bg-[#cc785c] text-white border-[#cc785c] shadow-md scale-105'
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
                  <span>최근 회전: <strong className="text-[#f4f3ef] font-mono">{formulaQueue[activeFormulaIdx] || '-'}</strong></span>
                </div>
                <span>마우스 드래그 또는 버튼으로 개별 면 회전</span>
              </div>
            </div>
          )}
        </section>

        {/* 우측 컨트롤 사이드바 */}
        <aside className="w-80 md:w-88 border-l border-[#2d2a25] bg-[#1d1b18] p-5 flex flex-col gap-5 overflow-y-auto z-10">
          <div className="p-4 rounded-xl bg-[#23211e] border border-[#35322c]">
            <div className="flex items-center gap-2 text-[#cc785c] mb-2">
              <Layers className="w-4 h-4" />
              <h2 className="text-xs font-semibold text-[#dedcd5]">해법 진행 상태</h2>
            </div>
            <div className="p-3 rounded-lg bg-[#181715] border border-[#2d2a25] text-xs leading-relaxed">
              <p className="font-medium text-[#f4f3ef] mb-1">{currentStep}</p>
              <p className="text-[#8e8b82] text-[11px]">
                큐브 면을 직접 드래그하거나 아래 버튼을 클릭하여 개별 면을 90도 회전할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-[11px] font-semibold tracking-wide uppercase text-[#8e8b82]">제어</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#282522] hover:bg-[#302d29] text-[#dedcd5] text-xs font-medium border border-[#3a3731] transition active:scale-[0.98]"
                onClick={() => setCurrentStep('Phase 3에서 무작위 섞기 기능이 연결됩니다.')}
              >
                <Shuffle className="w-3.5 h-3.5 text-[#cc785c]" />
                섞기 (Scramble)
              </button>

              <button 
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#cc785c] hover:bg-[#ba674d] text-white text-xs font-medium shadow-sm transition active:scale-[0.98]"
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  setCurrentStep('Phase 4에서 자동 맞춤 알고리즘이 연결됩니다.');
                }}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    일시정지
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    자동 맞춤
                  </>
                )}
              </button>
            </div>

            <button 
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-transparent hover:bg-[#282522] text-[#8e8b82] hover:text-[#dedcd5] text-xs border border-[#2d2a25] transition"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              큐브 원위치 리셋
            </button>
          </div>

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
              min={100}
              max={800}
              step={50}
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="w-full h-1.5 bg-[#181715] rounded-lg appearance-none cursor-pointer accent-[#cc785c]"
            />
            <div className="flex justify-between text-[10px] text-[#8e8b82]">
              <span>빠름 (100ms)</span>
              <span>기본 (250ms)</span>
              <span>느림 (800ms)</span>
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
                    onClick={() => handleManualRotate(face, 1)}
                    className="flex-1 py-1.5 rounded-md bg-[#24221e] hover:bg-[#2d2a25] text-[#dedcd5] font-medium border border-[#35322c] transition active:scale-95"
                    title={`${face} 시계방향 90도 회전`}
                  >
                    {face}
                  </button>
                  <button 
                    onClick={() => handleManualRotate(face, -1)}
                    className="flex-1 py-1.5 rounded-md bg-[#1d1b18] hover:bg-[#282522] text-[#cc785c] font-medium border border-[#35322c] transition active:scale-95"
                    title={`${face}' 반시계방향 90도 회전`}
                  >
                    {face}'
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-3 border-t border-[#2d2a25] text-[11px] text-[#8e8b82] flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#625f58]">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>3D 인터랙션 모드</span>
            </div>
            <span className="text-[10px] font-mono text-[#8e8b82]">Orbit + Raycast Drag</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
