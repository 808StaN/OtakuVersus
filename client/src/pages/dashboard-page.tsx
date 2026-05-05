import { Card } from '../components/ui/card';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../features/auth/auth-context';
import { useHistoryQuery } from '../features/history/use-history-query';
import { useEloLeaderboardQuery, useLeaderboardQuery } from '../features/leaderboard/use-leaderboard-query';

function resolveRankPosition(rows: Array<{ nickname: string; position: number }>, nickname: string | undefined) {
  const normalizedNickname = nickname?.trim().toLowerCase();
  if (!normalizedNickname) return null;
  return rows.find((row) => row.nickname.trim().toLowerCase() === normalizedNickname)?.position ?? null;
}

export function DashboardPage() {
  const { user } = useAuth();
  const historyQuery = useHistoryQuery(30);
  const singleLeaderboardQuery = useLeaderboardQuery(1000);
  const eloLeaderboardQuery = useEloLeaderboardQuery(1000);

  if (historyQuery.isLoading || singleLeaderboardQuery.isLoading || eloLeaderboardQuery.isLoading) {
    return <LoadingSpinner label="Loading dashboard stats..." />;
  }

  if (historyQuery.isError || !historyQuery.data) {
    return <ErrorState title="Dashboard unavailable" onRetry={() => historyQuery.refetch()} />;
  }

  const singleRank = resolveRankPosition(singleLeaderboardQuery.data?.leaderboard ?? [], user?.nickname);
  const multiplayerRank = resolveRankPosition(eloLeaderboardQuery.data?.leaderboard ?? [], user?.nickname);
  const singleStats = historyQuery.data.stats.singleplayer;
  const multiplayerStats = historyQuery.data.stats.multiplayer;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="comic-kicker">Player Dashboard</span>
          <span className="ink-stamp">Stats Center</span>
        </div>
        <h1 className="panel-title mt-3 text-4xl sm:text-5xl md:text-6xl">Welcome back, {user?.nickname}</h1>
      </Card>

      <Card className="space-y-5">
        <div className="grid gap-7 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="panel-title text-3xl sm:text-4xl">Singleplayer</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Current Rank</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{singleRank ? `#${singleRank}` : 'Unranked'}</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Matches Played</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{singleStats.sessionsPlayed}</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Best Score</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{singleStats.bestScore}</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Average Score</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{singleStats.averageScore}</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Average Accuracy</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{singleStats.averageAccuracy}%</p>
              </div>
            </div>
          </section>

          <section className="space-y-3 pt-3 lg:pt-0">
            <h2 className="panel-title text-3xl sm:text-4xl">Multiplayer</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Current Rank</p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {multiplayerRank ? `#${multiplayerRank}` : 'Unranked'}
                </p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Current ELO</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{user?.elo ?? 1000}</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Matches Played</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{multiplayerStats.matchesPlayed}</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Win Ratio</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{multiplayerStats.winRatio}%</p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">W / L / D</p>
                <p className="mt-1 text-2xl font-black text-slate-950">
                  {multiplayerStats.wins} / {multiplayerStats.losses} / {multiplayerStats.draws}
                </p>
              </div>
              <div className="comic-note">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Peak ELO</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{multiplayerStats.peakElo}</p>
              </div>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
}
