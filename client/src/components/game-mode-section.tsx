import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function GameModeSection({
  isAuthenticated,
  onMultiplayerStart,
  onSoloStart,
  soloLoading = false
}: {
  isAuthenticated: boolean;
  onMultiplayerStart: () => void;
  onSoloStart: () => void;
  soloLoading?: boolean;
}) {
  return (
    <section className="manga-panel manga-cut relative overflow-hidden px-6 py-10 md:px-10 md:py-12">
      <img
        src="/images/bg_otakuversus.png"
        alt="Manga cover background"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="manga-grid absolute inset-0 opacity-25" />
      <div className="absolute right-4 top-4 border-[4px] border-black bg-[#ffd000] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] shadow-sticker">
        Choose Your Mode
      </div>

      <div className="relative z-10 comic-gutters">
        <div className="space-y-5">
          <p className="comic-kicker">Anime Guessing Arena</p>
          <div className="relative">
            <h1
              className="text-5xl font-normal tracking-[0.06em] text-white md:text-8xl"
              style={{ WebkitTextStroke: '1.5px #000', textShadow: '3px 3px 0 #000' }}
            >
              <span className="text-white">Otaku</span>
              <span className="!text-[#bc002d]" style={{ color: '#bc002d' }}>
                Versus
              </span>
            </h1>
          </div>

          <div className="speech-bubble max-w-2xl">
            Step into an anime guessing game and name the title. 5 rounds, fast picks, and one
            goal: prove you're the biggest anime fan.
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!isAuthenticated ? (
              <Button size="lg" onClick={onMultiplayerStart}>
                Play as Guest
              </Button>
            ) : null}
            {!isAuthenticated ? (
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Create Account
                </Button>
              </Link>
            ) : null}
            <Link to="/leaderboard">
              <Button size="lg" variant="secondary">
                Explore Leaderboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3 panel-overlap-right">
          <div className="manga-panel p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf1a4f]">SinglePlayer</p>
            <p className="mt-2 text-sm text-base-ink/85">
              Play a classic solo run with 5 rounds and immediate score feedback after each answer.
            </p>
            <div className="mt-3">
              <Button onClick={onSoloStart} loading={soloLoading} size="sm">
                Play
              </Button>
            </div>
          </div>
          <div className="manga-panel p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf1a4f]">Multiplayer</p>
            <p className="mt-2 text-sm text-base-ink/85">
              Jump into matchmaking and battle another player live in the same timed round set.
            </p>
            <div className="mt-3">
              <Button onClick={onMultiplayerStart} size="sm">
                Play
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
