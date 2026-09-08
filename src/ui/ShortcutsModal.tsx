import { memo } from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal = memo(function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: '자동 맞춤 시작 / 일시정지 / 재개' },
    { key: 'S', desc: 'WCA 규격 22수 무작위 섞기 (Scramble)' },
    { key: 'R', desc: '큐브 원위치 초기화 (Reset)' },
    { key: '마우스 드래그', desc: '큐브 개별 면 90° 회전 조작' },
    { key: '큐브 밖 드래그', desc: '3D 큐브 전체 궤도(시점) 회전' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#1f1e1d] border border-[#32302c] shadow-2xl p-5 flex flex-col gap-4 text-[#faf9f5]">
        <div className="flex items-center justify-between border-b border-[#2d2a25] pb-3">
          <div className="flex items-center gap-2 text-[#cc785c]">
            <Keyboard className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-[#faf9f5]">키보드 및 제스처 단축키</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8e8b82] hover:text-[#faf9f5] hover:bg-[#2b2926] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          {shortcuts.map(({ key, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#181816] border border-[#2b2926]"
            >
              <span className="text-[#8e8b82]">{desc}</span>
              <kbd className="px-2 py-1 rounded bg-[#252421] border border-[#38352f] text-[#cc785c] font-mono text-[11px] font-semibold">
                {key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-[11px] text-[#8e8b82] text-center">
          Esc 키 또는 닫기 버튼을 눌러 창을 닫을 수 있습니다.
        </div>
      </div>
    </div>
  );
});
