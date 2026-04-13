import { Link, useNavigate } from 'react-router-dom';
import { HeroSection } from '../components/hero-section';
import { LeaderboardTable } from '../components/game/leaderboard-table';
import { useAuth } from '../features/auth/auth-context';
import { useLeaderboardQuery } from '../features/leaderboard/use-leaderboard-query';
import { useDifficultiesQuery } from '../features/game/use-scene-meta';
import { useStartGameMutation } from '../features/game/use-game';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/loading-spinner';

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const leaderboardQuery = useLeaderboardQuery(5);
  const difficultiesQuery = useDifficultiesQuery();
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
      <HeroSection
        isAuthenticated={isAuthenticated}
        onMultiplayerStart={handleMultiplayerStart}
        onSoloStart={handleSoloStart}
        soloLoading={startGameMutation.isPending}
      />

      <section className="comic-layout-asym">
        <Card>
          <span className="comic-kicker">How It Works</span>
          <ol className="mt-4 space-y-3 text-base-ink/85">
            <li>1. Start a session with 5 rounds.</li>
            <li>2. Study the scene and choose the correct anime.</li>
            <li>3. Earn points, finish the session, and enter the leaderboard.</li>
          </ol>
          <div className="mt-5">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button>Play Now</Button>
              </Link>
            ) : (
              <Button onClick={handleMultiplayerStart}>
                Multiplayer Mode
              </Button>
            )}
          </div>
        </Card>

        <Card className="panel-overlap-right">
          <div className="flex items-center justify-between gap-3">
            <span className="comic-kicker">Data Snapshot</span>
            <span className="ink-stamp">Live</span>
          </div>
          <div className="mt-4 space-y-3 text-sm text-base-ink/85">
            <p>
              Difficulties:{' '}
              <span className="font-bold text-[#ff7a00]">
                {difficultiesQuery.data?.difficulties?.join(', ') ?? 'Loading difficulty tiers...'}
              </span>
            </p>
            <p>The MVP uses illustrative placeholders that are easy to replace with your own visuals.</p>
          </div>
        </Card>
      </section>

      <section className="mx-auto w-full max-w-5xl">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="panel-title text-5xl">Top Players</h2>
            <Link to="/leaderboard" className="ink-link text-sm font-bold uppercase tracking-[0.14em]">
              Full leaderboard
            </Link>
          </div>
          {leaderboardQuery.isLoading ? (
            <LoadingSpinner label="Loading top players..." />
          ) : (
            <LeaderboardTable rows={leaderboardQuery.data?.leaderboard ?? []} />
          )}
        </div>

      </section>
    </div>
  );
}
