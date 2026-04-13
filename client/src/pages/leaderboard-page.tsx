import { mangaAssets } from '../assets/manga-assets';
import { LeaderboardTable } from '../components/game/leaderboard-table';
import { Card } from '../components/ui/card';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useLeaderboardQuery } from '../features/leaderboard/use-leaderboard-query';

export function LeaderboardPage() {
  const leaderboardQuery = useLeaderboardQuery(50);

  if (leaderboardQuery.isLoading) {
    return <LoadingSpinner label="Loading leaderboard..." />;
  }

  if (leaderboardQuery.isError || !leaderboardQuery.data) {
    return <ErrorState title="Leaderboard unavailable" onRetry={() => leaderboardQuery.refetch()} />;
  }

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

        <div className="space-y-4 panel-overlap-right">
          <div className="comic-bg-panel">
            <img src={mangaAssets.backgrounds.auditorium} alt="Tournament stage" className="h-32 w-full object-cover" loading="lazy" />
          </div>
          <Card className="overflow-hidden p-0">
            <img src={mangaAssets.portraits.heroScout} alt="Ranking rival" className="h-48 w-full object-cover" loading="lazy" />
          </Card>
        </div>
      </div>

      <div className="sfx-bam text-center">TOURNAMENT ARC</div>
      <LeaderboardTable rows={leaderboardQuery.data.leaderboard} />
    </div>
  );
}