import { Link } from 'react-router-dom';
import { Button } from './ui/button';

export function HeroSection({
  isAuthenticated,
  onGuestMultiplayerStart,
  onSoloStart,
  soloLoading = false
}: {
  isAuthenticated: boolean;
  onGuestMultiplayerStart: () => void;
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
        Cover Story
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
            Enter a stylized scene arena and guess titles from pure atmosphere. 5 rounds, fast
            decisions, and a leaderboard for the sharpest otaku.
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg">Start Game</Button>
              </Link>
            ) : (
              <Button size="lg" onClick={onGuestMultiplayerStart}>
                Play as Guest
              </Button>
            )}
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
            <p className="text-xs uppercase tracking-[0.16em] text-[#cf1a4f]">Main Street Frame</p>
            <p className="mt-2 text-sm text-base-ink/85">
              Urban anime backdrop now drives the whole page mood to preview your final paid assets style.
            </p>
            <div className="mt-3">
              <Button onClick={onSoloStart} loading={soloLoading} size="sm">
                Solo Mode
              </Button>
            </div>
          </div>
          <div className="comic-bg-panel">
            <img
              src="/images/bg_otakuversus.png"
              alt="Anime city panel"
              className="h-40 w-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute bottom-3 left-3 border-[4px] border-black bg-[#cf1a4f] px-3 py-1 text-xs font-black uppercase tracking-[0.13em] text-white shadow-sticker">
              Tokyo Vibe
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
