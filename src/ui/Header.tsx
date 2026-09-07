import { Box, CheckCircle2, AlertCircle, Compass, Keyboard } from 'lucide-react';

interface HeaderProps {
  isSolved: boolean;
  onToggleShortcuts: () => void;
}

export function Header({ isSolved, onToggleShortcuts }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-[#2d2a25] bg-[#1d1b18]/85 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/30 flex items-center justify-center text-[#cc785c]">
          <Box className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-[#faf9f5] font-serif-claude italic">
            Rubik's Solver
          </h1>
          <span className="text-xs text-[#8e8b82] font-normal hidden sm:inline">
            3D Intelligent Visualizer
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-xs">
        {/* 솔브 상태 뱃지 */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#24221e] border border-[#32302c]">
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

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#24221e] border border-[#32302c] text-[#8e8b82]">
          <Compass className="w-3.5 h-3.5 text-[#cc785c]" />
          <span>Kociemba 2-Phase</span>
        </div>

        {/* 단축키 가이드 토글 버튼 */}
        <button
          onClick={onToggleShortcuts}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#24221e] hover:bg-[#2c2a26] border border-[#32302c] text-[#8e8b82] hover:text-[#faf9f5] transition"
          title="단축키 안내"
        >
          <Keyboard className="w-3.5 h-3.5 text-[#cc785c]" />
          <span className="hidden sm:inline">단축키</span>
        </button>
      </div>
    </header>
  );
}
