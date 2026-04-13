import { cn } from '../../utils/cn';

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center border-[4px] border-black bg-[#ffd000] px-4 py-1 text-sm font-black uppercase tracking-[0.12em] text-black shadow-sticker',
        className
      )}
    >
      SCORE: {score}
    </div>
  );
}