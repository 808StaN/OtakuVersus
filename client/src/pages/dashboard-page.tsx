import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { useHistoryQuery } from '../features/history/use-history-query';
import { useStartGameMutation } from '../features/game/use-game';
import { useLeaderboardQuery } from '../features/leaderboard/use-leaderboard-query';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { EmptyState } from '../components/ui/empty-state';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const historyQuery = useHistoryQuery(5);
  const leaderboardQuery = useLeaderboardQuery(1000);
  const startGameMutation = useStartGameMutation();
  const leaderboardRows = leaderboardQuery.data?.leaderboard ?? [];
  const normalizedUserNickname = user?.nickname.trim().toLowerCase();
  const currentRankPosition =
    normalizedUserNickname
      ? leaderboardRows.find((row) => row.nickname.trim().toLowerCase() === normalizedUserNickname)?.position ?? null
      : null;

  const handleStartGame = async () => {
    const payload = await startGameMutation.mutateAsync(5);
    navigate(`/game/${payload.session.id}`);
  };

  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="comic-kicker">Command Center</span>
          <span className="ink-stamp">Player HQ</span>
        </div>
        <h1 className="panel-title mt-3 text-6xl">Welcome back, {user?.nickname}</h1>
        <div className="speech-bubble mt-4 max-w-2xl">
          Launch a new session and jump into 5 rounds. Every correct answer gives points, and
          speed adds a bonus.
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={handleStartGame} loading={startGameMutation.isPending}>
            Start New Game
          </Button>
          <Button onClick={() => navigate('/multiplayer')}>
            Multiplayer Mode
          </Button>
          <Button variant="secondary" onClick={() => navigate('/history')}>
            View History
          </Button>
          <Button variant="secondary" onClick={() => navigate('/leaderboard')}>
            Open Leaderboard
          </Button>
        </div>
      </Card>

      <section className="comic-gutters">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-base-ink/70">Sessions</p>
          <p className="mt-2 text-4xl font-black text-base-ink">{historyQuery.data?.stats.totalSessions ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-base-ink/70">Average Score</p>
          <p className="mt-2 text-4xl font-black text-[#cf1a4f]">{historyQuery.data?.stats.averageScore ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-base-ink/70">Current Rank</p>
          <p className="mt-2 text-2xl font-black text-[#ff7a00]">
            {leaderboardQuery.isLoading ? 'Loading...' : currentRankPosition ? `#${currentRankPosition}` : 'Unranked'}
          </p>
        </Card>
      </section>

      <section>
        <Card>
          <h2 className="panel-title text-5xl">Recent Sessions</h2>
          {historyQuery.isLoading ? (
            <LoadingSpinner label="Loading your sessions..." />
          ) : historyQuery.data && historyQuery.data.history.length > 0 ? (
            <div className="mt-4 space-y-3">
              {historyQuery.data.history.map((session) => (
                <div
                  key={session.sessionId}
                  className="border-[4px] border-black bg-[#fffdf7] p-3 text-sm text-base-ink shadow-sticker"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black">Score: {session.score}</span>
                    <span className="font-bold">{session.accuracy}% accuracy</span>
                  </div>
                  <p className="mt-1 text-base-ink/70">
                    {new Intl.DateTimeFormat('pl-PL', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(new Date(session.playedAt))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sessions yet"
              description="Play your first game to unlock personal stats."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
