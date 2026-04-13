import { LeaderboardRow } from '../../types/api';
import { Card } from '../ui/card';

function formatDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function LeaderboardTable({
  rows,
  embedded = false,
  compact = false
}: {
  rows: LeaderboardRow[];
  embedded?: boolean;
  compact?: boolean;
}) {
  const table = (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm text-base-ink/90">
          <thead className="bg-[#ffd000] text-xs uppercase tracking-[0.18em] text-black">
            <tr>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>#</th>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>Player</th>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>Score</th>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>Accuracy</th>
              {!compact ? <th className="px-4 py-3">Date</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const accuracy = Math.round((row.correctAnswers / row.totalRounds) * 100);
              const rankClass =
                row.position === 1
                  ? 'bg-[#fff3bd]'
                  : row.position === 2
                    ? 'bg-[#fde3ec]'
                    : row.position === 3
                      ? 'bg-[#ffe8cc]'
                      : 'bg-transparent';

              return (
                <tr
                  key={row.sessionId}
                  className={`border-t-[4px] border-black/70 odd:bg-black/5 even:bg-black/10 ${rankClass}`}
                >
                  <td className={compact ? 'px-3 py-2 font-black text-[#cf1a4f]' : 'px-4 py-3 font-black text-[#cf1a4f]'}>{row.position}</td>
                  <td className={compact ? 'px-3 py-2 font-bold' : 'px-4 py-3 font-bold'}>{row.nickname}</td>
                  <td className={compact ? 'px-3 py-2 font-black text-[#ff7a00]' : 'px-4 py-3 font-black text-[#ff7a00]'}>{row.score}</td>
                  <td className={compact ? 'px-3 py-2' : 'px-4 py-3'}>{accuracy}%</td>
                  {!compact ? <td className="px-4 py-3 text-base-ink/70">{formatDate(row.playedAt)}</td> : null}
                </tr>
              );
            })}
          </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return table;
  }

  return <Card className="overflow-hidden p-0">{table}</Card>;
}
