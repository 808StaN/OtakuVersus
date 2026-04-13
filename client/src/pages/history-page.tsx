import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { EmptyState } from '../components/ui/empty-state';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useHistoryQuery } from '../features/history/use-history-query';

export function HistoryPage() {
  const navigate = useNavigate();
  const historyQuery = useHistoryQuery(30);

  if (historyQuery.isLoading) {
    return <LoadingSpinner label="Loading your history..." />;
  }

  if (historyQuery.isError || !historyQuery.data) {
    return <ErrorState title="History unavailable" onRetry={() => historyQuery.refetch()} />;
  }

  if (historyQuery.data.history.length === 0) {
    return (
      <EmptyState
        title="No completed sessions"
        description="Play your first run to populate history and personal stats."
        action={<Button onClick={() => navigate('/dashboard')}>Start Game</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="comic-gutters">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-base-ink/70">Total Sessions</p>
          <p className="mt-2 text-4xl font-black text-base-ink">{historyQuery.data.stats.totalSessions}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-base-ink/70">Best Score</p>
          <p className="mt-2 text-4xl font-black text-[#cf1a4f]">{historyQuery.data.stats.bestScore}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-base-ink/70">Current Badge</p>
          <p className="mt-2 text-2xl font-black text-[#ff7a00]">{historyQuery.data.stats.rank}</p>
        </Card>
      </section>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h1 className="panel-title text-5xl">Session History</h1>
          <span className="ink-stamp">Archive</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-base-ink/90">
            <thead className="bg-[#ffd000] text-xs uppercase tracking-[0.15em] text-black">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Correct</th>
                <th className="px-3 py-2">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {historyQuery.data.history.map((item) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}