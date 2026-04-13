import { LeaderboardTable } from '../components/game/leaderboard-table';
import { Card } from '../components/ui/card';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../features/auth/auth-context';
import { useHistoryQuery } from '../features/history/use-history-query';
import { useLeaderboardQuery } from '../features/leaderboard/use-leaderboard-query';

export function LeaderboardPage() {
  const { isAuthenticated, user } = useAuth();
  const leaderboardQuery = useLeaderboardQuery(1000);
  const myHistoryQuery = useHistoryQuery(50, isAuthenticated);

  if (leaderboardQuery.isLoading) {
    return <LoadingSpinner label="Loading leaderboard..." />;
  }

  if (leaderboardQuery.isError || !leaderboardQuery.data) {
    return <ErrorState title="Leaderboard unavailable" onRetry={() => leaderboardQuery.refetch()} />;
  }

  const allRows = leaderboardQuery.data.leaderboard;
  const tableRows = allRows.slice(0, 50);
  const highestScore = allRows.length ? Math.max(...allRows.map((row) => row.score)) : 0;
  const avgScore = allRows.length ? Math.round(allRows.reduce((acc, row) => acc + row.score, 0) / allRows.length) : 0;
  const avgAccuracy = allRows.length
    ? Math.round((allRows.reduce((acc, row) => acc + (row.correctAnswers / row.totalRounds) * 100, 0) / allRows.length) * 10) / 10
    : 0;
  const myStats = myHistoryQuery.data?.stats;
  const hasMyStats = Boolean(isAuthenticated && myStats);
  const normalizedUserNickname = user?.nickname.trim().toLowerCase();
  const myRankPosition =
    normalizedUserNickname
      ? allRows.find((row) => row.nickname.trim().toLowerCase() === normalizedUserNickname)?.position ?? null
      : null;

  return (
    <div className="space-y-5">
      <div className="comic-layout-asym">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="comic-kicker">Ranking Board</span>
            <span className="ink-stamp">Top 50</span>
          </div>
          <h1 className="panel-title mt-3 text-6xl">Global Leaderboard</h1>
          <div className="speech-bubble mt-4 max-w-2xl">
            The highest scores across all players. Precision and pace decide everything here.
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <span className="comic-kicker">Your Stats</span>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:text-base">
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {hasMyStats ? 'Best Score' : 'Top Score'}
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">{hasMyStats ? myStats?.bestScore : highestScore}</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {hasMyStats ? 'Avg Score' : 'Avg Score (Top 50)'}
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {hasMyStats ? Math.round(myStats?.averageScore ?? 0) : avgScore}
                </p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {hasMyStats ? 'Sessions' : 'Avg Accuracy (Top 50)'}
                </p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {hasMyStats ? myStats?.totalSessions : `${avgAccuracy}%`}
                </p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {hasMyStats ? 'Current Rank' : 'Ranked Runs (Top 50)'}
                </p>
                <p className="mt-1 text-base font-black text-slate-950">
                  {hasMyStats ? (myRankPosition ? `#${myRankPosition}` : 'Unranked') : tableRows.length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="sfx-bam text-center">TOP 50</div>
      <LeaderboardTable rows={tableRows} />
    </div>
  );
}
