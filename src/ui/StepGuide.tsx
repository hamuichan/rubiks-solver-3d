import { memo } from 'react';
import { Layers, CheckCircle2, Clock } from 'lucide-react';

interface StepGuideProps {
  currentStep: string;
  isSolved: boolean;
  isPlaying: boolean;
  activeFormulaIdx: number;
  totalMoves: number;
}

export const StepGuide = memo(function StepGuide({
  currentStep,
  isSolved,
  isPlaying,
  activeFormulaIdx,
  totalMoves,
}: StepGuideProps) {
  // 2-Phase 중 현재 활성화된 단계 판별 (중간 지점 기준)
  const isPhase2 = isPlaying && totalMoves > 0 && activeFormulaIdx >= Math.ceil(totalMoves / 2);
  const isPhase1 = isPlaying && !isPhase2;

  return (
    <div className="p-4 rounded-xl bg-[#23211e] border border-[#32302c] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#cc785c]">
          <Layers className="w-4 h-4" />
          <h2 className="text-xs font-semibold text-[#dedcd5]">해법 단계 가이드</h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20 font-mono">
          2-Phase
        </span>
      </div>

      {/* 현재 실시간 가이드 메시지 카드 */}
      <div className="p-3 rounded-lg bg-[#181816] border border-[#2b2926] text-xs leading-relaxed">
        <p className="font-medium text-[#faf9f5] mb-1">{currentStep}</p>
        <p className="text-[#8e8b82] text-[11px]">
          {isSolved
            ? '큐브가 모두 맞춰진 상태입니다. [S] 키 또는 [섞기]를 눌러보세요.'
            : isPlaying
            ? '2-Phase 엔진이 20수 내외의 최단 경로로 각 슬롯을 순차 정렬 중입니다.'
            : '큐브가 섞여 있습니다. [Space] 키 또는 [자동 맞춤]을 눌러 복원하세요.'}
        </p>
      </div>

      {/* Kociemba 2단계 구조 요약 */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#2d2a25]">
        {/* Phase 1 */}
        <div
          className={`p-2.5 rounded-lg border text-[11px] transition-all duration-200 ${
            isPhase1
              ? 'bg-[#cc785c]/15 border-[#cc785c] text-[#faf9f5]'
              : isSolved || isPhase2
              ? 'bg-[#1c1b18] border-[#2b2926] text-[#8e8b82]'
              : 'bg-[#1e1d1a] border-[#2f2d29] text-[#dedcd5]'
          }`}
        >
          <div className="flex items-center justify-between font-semibold mb-0.5">
            <span className="flex items-center gap-1.5">
              {isSolved || isPhase2 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : isPhase1 ? (
                <Clock className="w-3.5 h-3.5 text-[#cc785c] animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#6a6761]" />
              )}
              Phase 1: G1 하위군 환원
            </span>
            <span className="text-[10px] font-mono text-[#8e8b82]">
              {isSolved || isPhase2 ? '완료' : isPhase1 ? '진행 중' : '대기'}
            </span>
          </div>
          <p className="text-[10px] text-[#8e8b82] leading-tight pl-5">
            모든 엣지 및 코너의 방향성을 올바르게 정렬합니다.
          </p>
        </div>

        {/* Phase 2 */}
        <div
          className={`p-2.5 rounded-lg border text-[11px] transition-all duration-200 ${
            isPhase2
              ? 'bg-[#cc785c]/15 border-[#cc785c] text-[#faf9f5]'
              : isSolved
              ? 'bg-[#1c1b18] border-[#2b2926] text-[#8e8b82]'
              : 'bg-[#1e1d1a] border-[#2f2d29] text-[#dedcd5]'
          }`}
        >
          <div className="flex items-center justify-between font-semibold mb-0.5">
            <span className="flex items-center gap-1.5">
              {isSolved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : isPhase2 ? (
                <Clock className="w-3.5 h-3.5 text-[#cc785c] animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-[#6a6761]" />
              )}
              Phase 2: 최종 슬롯 복원
            </span>
            <span className="text-[10px] font-mono text-[#8e8b82]">
              {isSolved ? '완료' : isPhase2 ? '진행 중' : '대기'}
            </span>
          </div>
          <p className="text-[10px] text-[#8e8b82] leading-tight pl-5">
            6개 면 전체 슬롯을 완성하여 100% 복원을 완료합니다.
          </p>
        </div>
      </div>
    </div>
  );
});
