import { ScoreBadge } from './score-badge';

export function GameHUD({
  round,
  totalRounds,
  score,
  timerMs,
  roundDurationMs = 30_000
}: {
  round: number;
  totalRounds: number;
  score: number;
  timerMs: number;
  roundDurationMs?: number;
}) {
  const seconds = Math.max(0, Math.ceil(timerMs / 1000));
  const progress = Math.max(0, Math.min(100, (timerMs / roundDurationMs) * 100));

  return (
    <div className="manga-panel manga-border grid gap-3 p-3 sm:p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <div className="border-[4px] border-black bg-[#fffdf7] px-3 py-2 text-base-ink shadow-sticker">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-base-ink/70">Round</p>
        <p className="text-lg font-black">
          {round} / {totalRounds}
        </p>
      </div>

      <div className="mx-auto w-fit">
        <ScoreBadge score={score} />
      </div>

      <div className="min-w-[170px] border-[4px] border-black bg-[#fffdf7] px-3 py-2 text-base-ink shadow-sticker">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-base-ink/75">Time Left</p>
        <div className="mt-2 h-3 w-full bg-white/70">
          <div className="h-full bg-[#bc002d] transition-[width] duration-75 ease-linear" style={{ width: `${progress.toFixed(3)}%` }} />
        </div>
        <p className="mt-1 text-right text-lg font-black">{seconds}s</p>
      </div>
    </div>
  );
}
