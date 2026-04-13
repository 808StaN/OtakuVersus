import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useHistoryQuery } from '../features/history/use-history-query';

export function HistoryPage() {
  const historyQuery = useHistoryQuery(50);
  const [mode, setMode] = useState<'SINGLEPLAYER' | 'MULTIPLAYER'>('SINGLEPLAYER');

  if (historyQuery.isLoading) {
    return <LoadingSpinner label="Loading your history..." />;
  }

  if (historyQuery.isError || !historyQuery.data) {
    return <ErrorState title="History unavailable" onRetry={() => historyQuery.refetch()} />;
  }

  const filteredHistory = historyQuery.data.history.filter((item) => item.mode === mode);

  if (filteredHistory.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        description={`You have no ${mode === 'SINGLEPLAYER' ? 'singleplayer' : 'multiplayer'} matches yet.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h1 className="panel-title text-5xl">Matches History</h1>
          <span className="ink-stamp">Archive</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => setMode('SINGLEPLAYER')}
            className={mode === 'SINGLEPLAYER' ? '' : 'bg-[#fffdf7] text-base-ink'}
          >
            Singleplayer
          </Button>
          <Button
            type="button"
            onClick={() => setMode('MULTIPLAYER')}
            className={mode === 'MULTIPLAYER' ? '' : 'bg-[#fffdf7] text-base-ink'}
          >
            Multiplayer
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-base-ink/90">
            <thead className="bg-[#ffd000] text-xs uppercase tracking-[0.15em] text-black">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Correct</th>
                <th className="px-3 py-2">Accuracy</th>
                {mode === 'MULTIPLAYER' ? <th className="px-3 py-2">LP</th> : null}
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.sessionId} className="border-t-[4px] border-black/70 odd:bg-black/5 even:bg-black/10">
                  <td className="px-3 py-2 text-base-ink/75">
                    {new Intl.DateTimeFormat('pl-PL', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(new Date(item.playedAt))}
                  </td>
                  <td className="px-3 py-2 font-black">{item.score}</td>
                  <td className="px-3 py-2 font-bold">
                    {item.correctAnswers}/{item.totalRounds}
                  </td>
                  <td className="px-3 py-2 font-bold">{item.accuracy}%</td>
                  {mode === 'MULTIPLAYER' ? (
                    <td className={`px-3 py-2 font-black ${item.eloDelta >= 0 ? 'text-[#1c8c3a]' : 'text-[#bc002d]'}`}>
                      {item.eloDelta > 0 ? '+' : ''}
                      {item.eloDelta}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
