import { EloLeaderboardRow, LeaderboardRow } from '../../types/api';
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
  rankingType = 'single',
  embedded = false,
  compact = false
}: {
  rows: LeaderboardRow[] | EloLeaderboardRow[];
  rankingType?: 'single' | 'elo';
  embedded?: boolean;
  compact?: boolean;
}) {
  const singleRows = rankingType === 'single' ? (rows as LeaderboardRow[]) : [];
  const eloRows = rankingType === 'elo' ? (rows as EloLeaderboardRow[]) : [];
  const table = (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full text-left text-sm text-base-ink/90">
          <thead className="bg-[#ffd000] text-xs uppercase tracking-[0.18em] text-black">
            <tr>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>#</th>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>Player</th>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                {rankingType === 'single' ? 'Score' : 'ELO'}
              </th>
              <th className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                {rankingType === 'single' ? 'Accuracy' : 'Matches'}
              </th>
              {!compact ? (
                <th className="px-4 py-3">{rankingType === 'single' ? 'Date' : 'Win Ratio'}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {(rankingType === 'single' ? singleRows : eloRows).map((row) => {
              const accuracy =
                rankingType === 'single'
                  ? Math.round(((row as LeaderboardRow).correctAnswers / (row as LeaderboardRow).totalRounds) * 100)
                  : null;
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
                  key={rankingType === 'single' ? (row as LeaderboardRow).sessionId : (row as EloLeaderboardRow).userId}
                  className={`border-t-[4px] border-black/70 odd:bg-black/5 even:bg-black/10 ${rankClass}`}
                >
                  <td className={compact ? 'px-3 py-2 font-black text-[#cf1a4f]' : 'px-4 py-3 font-black text-[#cf1a4f]'}>{row.position}</td>
                  <td className={compact ? 'px-3 py-2 font-bold' : 'px-4 py-3 font-bold'}>{row.nickname}</td>
                  <td className={compact ? 'px-3 py-2 font-black text-[#ff7a00]' : 'px-4 py-3 font-black text-[#ff7a00]'}>
                    {rankingType === 'single' ? (row as LeaderboardRow).score : (row as EloLeaderboardRow).elo}
                  </td>
                  <td className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
                    {rankingType === 'single' ? `${accuracy}%` : (row as EloLeaderboardRow).matchesPlayed}
                  </td>
                  {!compact ? (
                    <td className="px-4 py-3 text-base-ink/70">
                      {rankingType === 'single'
                        ? formatDate(row.playedAt)
                        : `${(row as EloLeaderboardRow).winRatio}%`}
                    </td>
                  ) : null}
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

  return <Card className="overflow-hidden !p-0">{table}</Card>;
}
