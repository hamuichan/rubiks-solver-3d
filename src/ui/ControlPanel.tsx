import { memo } from 'react';
import { Shuffle, Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { Face, RotationDirection } from '../core/types';

interface ControlPanelProps {
  speedMs: number;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  isPaused: boolean;
  isScrambling: boolean;
  onScramble: () => void;
  onAutoSolveToggle: () => void;
  onReset: () => void;
  onManualRotate: (face: Face, direction: RotationDirection) => void;
}

export const ControlPanel = memo(function ControlPanel({
  speedMs,
  onSpeedChange,
  isPlaying,
  isPaused,
  isScrambling,
  onScramble,
  onAutoSolveToggle,
  onReset,
  onManualRotate,
}: ControlPanelProps) {
  const isBusy = isScrambling;

  return (
    <div className="flex flex-col gap-4">
      {/* 메인 제어 액션 */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide uppercase text-[#8e8b82]">
          메인 액션
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {/* 섞기 버튼 */}
          <button
            disabled={isBusy || (isPlaying && !isPaused)}
            onClick={onScramble}
            className="relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#282522] hover:bg-[#302d29] disabled:opacity-40 text-[#dedcd5] text-xs font-medium border border-[#37342f] transition active:scale-[0.98]"
          >
            <Shuffle className={`w-3.5 h-3.5 text-[#cc785c] ${isScrambling ? 'animate-spin' : ''}`} />
            <span>{isScrambling ? '섞는 중...' : '섞기'}</span>
            <kbd className="hidden lg:inline text-[9px] px-1 rounded bg-[#1c1b18] border border-[#32302c] text-[#8e8b82] font-mono ml-0.5">
              S
            </kbd>
          </button>

          {/* 자동 맞춤 / 일시정지 버튼 */}
          <button
            disabled={isBusy}
            onClick={onAutoSolveToggle}
            className={`relative flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-white text-xs font-medium shadow-sm transition active:scale-[0.98] ${
              isPlaying
                ? isPaused
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-[#3d3a35] hover:bg-[#48453f] border border-[#524e47]'
                : 'bg-[#cc785c] hover:bg-[#ba674d]'
            }`}
          >
            {isPlaying ? (
              isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>재개</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>일시정지</span>
                </>
              )
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>자동 맞춤</span>
              </>
            )}
            <kbd className="hidden lg:inline text-[9px] px-1 rounded bg-black/20 border border-white/10 text-white/80 font-mono ml-0.5">
              Space
            </kbd>
          </button>
        </div>

        {/* 큐브 초기화 버튼 */}
        <button
          disabled={isBusy}
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-transparent hover:bg-[#282522] disabled:opacity-40 text-[#8e8b82] hover:text-[#dedcd5] text-xs border border-[#2d2a25] transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>큐브 원위치 리셋</span>
          <kbd className="text-[9px] px-1 rounded bg-[#1c1b18] border border-[#32302c] text-[#8e8b82] font-mono ml-0.5">
            R
          </kbd>
        </button>
      </div>

      {/* 속도 조절 슬라이더 */}
      <div className="p-3.5 rounded-xl bg-[#23211e] border border-[#32302c] flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#dedcd5]">
            <Clock className="w-3.5 h-3.5 text-[#cc785c]" />
            <span className="font-medium">회전 애니메이션 속도</span>
          </div>
          <span className="font-mono text-[#cc785c] text-xs font-semibold">{speedMs}ms</span>
        </div>
        <input
          type="range"
          min={60}
          max={800}
          step={20}
          value={speedMs}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#181816] rounded-lg appearance-none cursor-pointer accent-[#cc785c]"
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
          <h3 className="text-[11px] font-semibold tracking-wide uppercase text-[#8e8b82]">
            수동 회전 조작
          </h3>
          <span className="text-[10px] text-[#625f58]">Singmaster</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
          {(['U', 'D', 'L', 'R', 'F', 'B'] as Face[]).map((face) => (
            <div key={face} className="flex gap-1">
              <button
                disabled={isBusy || (isPlaying && !isPaused)}
                onClick={() => onManualRotate(face, 1)}
                className="flex-1 py-1.5 rounded-lg bg-[#24221e] hover:bg-[#2c2a26] disabled:opacity-40 text-[#dedcd5] font-medium border border-[#32302c] transition active:scale-95"
                title={`${face} 시계방향 90도`}
              >
                {face}
              </button>
              <button
                disabled={isBusy || (isPlaying && !isPaused)}
                onClick={() => onManualRotate(face, -1)}
                className="flex-1 py-1.5 rounded-lg bg-[#1e1d1a] hover:bg-[#282622] disabled:opacity-40 text-[#cc785c] font-medium border border-[#32302c] transition active:scale-95"
                title={`${face}' 반시계방향 90도`}
              >
                {face}'
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
