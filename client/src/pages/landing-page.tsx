import { Link, useNavigate } from 'react-router-dom';
import { GameModeSection } from '../components/game-mode-section';
import { LeaderboardTable } from '../components/game/leaderboard-table';
import { useAuth } from '../features/auth/auth-context';
import { useLeaderboardQuery } from '../features/leaderboard/use-leaderboard-query';
import { useStartGameMutation } from '../features/game/use-game';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const leaderboardQuery = useLeaderboardQuery(5);
  const startGameMutation = useStartGameMutation();

  const handleSoloStart = async () => {
    const payload = await startGameMutation.mutateAsync(5);
    navigate(`/game/${payload.session.id}`);
  };

  const handleMultiplayerStart = () => {
    navigate('/multiplayer');
  };

  return (
    <div className="space-y-10">
      <GameModeSection
        isAuthenticated={isAuthenticated}
        onMultiplayerStart={handleMultiplayerStart}
        onSoloStart={handleSoloStart}
        soloLoading={startGameMutation.isPending}
      />

      <section className="grid items-start gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <span className="comic-kicker">How It Works</span>
          <ol className="mt-4 space-y-3 text-base-ink/85">
            <li>1. Pick your mode: SinglePlayer for solo runs or Multiplayer for live duels.</li>
            <li>2. Analyze each frame and type the anime title with live search suggestions.</li>
            <li>3. Complete 5 rounds, lock your score, and track your progress in history and ranks.</li>
          </ol>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <span className="comic-kicker">Ranking</span>
            <span className="ink-stamp">Live</span>
          </div>
          <div className="mt-3 overflow-hidden border-[4px] border-black bg-[#f8f3e6] shadow-sticker">
            {leaderboardQuery.isLoading ? (
              <LoadingSpinner label="Loading top players..." />
            ) : (
              <LeaderboardTable rows={leaderboardQuery.data?.leaderboard ?? []} embedded />
            )}
          </div>
          <div className="mt-4 text-right">
            <Link to="/leaderboard" className="ink-link text-sm font-bold uppercase tracking-[0.14em]">
              Full leaderboard
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
