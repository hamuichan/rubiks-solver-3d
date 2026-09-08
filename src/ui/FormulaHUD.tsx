import { memo, useEffect, useRef } from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { getMoveDescription } from './moveDescriptions';

interface FormulaHUDProps {
  formulaQueue: string[];
  activeFormulaIdx: number;
  isScrambling: boolean;
  isPlaying: boolean;
  isPaused: boolean;
}

export const FormulaHUD = memo(function FormulaHUD({
  formulaQueue,
  activeFormulaIdx,
  isScrambling,
  isPlaying,
  isPaused,
}: FormulaHUDProps) {
  const activeChipRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 활성화된 공식 칩이 화면 중앙에 위치하도록 부드럽게 스크롤
  useEffect(() => {
    if (activeChipRef.current && scrollContainerRef.current) {
      activeChipRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeFormulaIdx]);

  if (formulaQueue.length === 0) return null;

  const total = formulaQueue.length;
  const currentCount = Math.max(0, Math.min(activeFormulaIdx + 1, total));
  const progressPercent = total > 0 ? Math.round((currentCount / total) * 100) : 0;
  const currentMove = formulaQueue[activeFormulaIdx] || '-';

  return (
    <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-auto sm:w-[500px] md:w-[520px] rounded-xl bg-[#1f1e1d]/95 border border-[#32302c] shadow-lg backdrop-blur-md z-10 pointer-events-auto overflow-hidden">
      {/* 상단 미니멀 슬림 프로그레스 바 */}
      <div className="w-full h-1 bg-[#181816]">
        <div
          className="h-full bg-[#cc785c] transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 flex flex-col gap-2.5">
        {/* 헤더 & 진행률 카운터 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#dedcd5]">
            <Sparkles className="w-3.5 h-3.5 text-[#cc785c]" />
            <span>
              {isScrambling
                ? 'WCA 스크램블 생성 시퀀스'
                : isPlaying
                ? 'Kociemba 2-Phase 최적 복원 시퀀스'
                : '회전 공식 시퀀스 (Singmaster)'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8e8b82]">
            {currentCount} / {total} Moves ({progressPercent}%)
          </span>
        </div>

        {/* 클로드 스타일 공식 칩 티커 */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 py-1.5 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {formulaQueue.map((move, idx) => {
            const isActive = idx === activeFormulaIdx;
            const isPast = idx < activeFormulaIdx;

            return (
              <div
                key={idx}
                ref={isActive ? activeChipRef : null}
                className={`min-w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center font-mono text-xs font-semibold rounded-lg border transition-all duration-150 ${
                  isActive
                    ? 'bg-[#cc785c] text-white border-[#cc785c] shadow-md scale-105'
                    : isPast
                    ? 'bg-[#181816] text-[#6a6761] border-[#2b2926]'
                    : 'bg-[#272522] text-[#b4b2ac] border-[#38352f]'
                }`}
              >
                {move}
              </div>
            );
          })}
        </div>

        {/* 현재 수 설명 및 상태 바 */}
        <div className="pt-2 border-t border-[#2d2a25] flex items-center justify-between text-[11px] text-[#8e8b82]">
          <div className="flex items-center gap-1.5 truncate">
            <ChevronRight className="w-3.5 h-3.5 text-[#cc785c] flex-shrink-0" />
            <span className="truncate">
              현재: <strong className="text-[#faf9f5] font-mono">{currentMove}</strong>
              {currentMove !== '-' && (
                <span className="text-[#8e8b82] ml-1.5 font-normal">
                  ({getMoveDescription(currentMove)})
                </span>
              )}
            </span>
          </div>

          <span className="flex-shrink-0 font-medium text-[10px] text-[#cc785c]">
            {isScrambling
              ? '스크램블 적용 중'
              : isPlaying
              ? isPaused
                ? '일시정지됨'
                : '순차 복원 중'
              : '준비 완료'}
          </span>
        </div>
      </div>
    </div>
  );
});
