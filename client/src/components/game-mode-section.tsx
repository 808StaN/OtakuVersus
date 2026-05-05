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
    <section className="landing-hero-bg relative overflow-hidden border-4 border-black px-3 py-5 shadow-[4px_4px_0_#000] sm:px-6 sm:py-8 sm:shadow-[6px_6px_0_#000] md:px-10 md:py-12">
      <div className="absolute inset-0 bg-[#f5f0e3]/25" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="page-background-filter absolute inset-0" />
      <div className="relative z-10 mb-3 inline-flex border-[4px] border-black bg-[#ffd000] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] shadow-sticker sm:absolute sm:right-4 sm:top-4 sm:mb-0 sm:text-xs">
        Choose Your Mode
      </div>

      <div className="relative z-10 comic-gutters">
        <div className="space-y-3">
          <p className="comic-kicker">Anime Guessing Arena</p>
          <div className="relative">
            <h1
              className="text-[clamp(2.6rem,13vw,5rem)] font-normal leading-[0.86] tracking-[0.06em] text-white sm:text-[clamp(3rem,11vw,6rem)] md:text-8xl"
              style={{
                textShadow: `
                  -1.5px -1.5px 0 #000,
                   0px   -1.5px 0 #000,
                   1.5px -1.5px 0 #000,
                   1.5px  0px   0 #000,
                   1.5px  1.5px 0 #000,
                   0px    1.5px 0 #000,
                  -1.5px  1.5px 0 #000,
                  -1.5px  0px   0 #000,
                   5px    5px   0 rgba(0,0,0,0.9)
                `
              }}
            >
              <span className="text-white">Otaku</span>
              <span className="!text-[#cf1a4f]" style={{ color: '#cf1a4f' }}>
                Versus
              </span>
            </h1>
          </div>

          <div className="speech-bubble max-w-2xl text-sm leading-relaxed sm:text-base">
            Step into an anime guessing game and name the title. 5 rounds, fast picks, and one
            goal: prove you're the biggest anime fan.
          </div>

          <div className="-mt-1 flex flex-col gap-2 pt-0">
            <div className="flex min-h-[92px] items-end gap-2 sm:min-h-[165px] sm:gap-3 md:min-h-[190px]">
              <img
                src="/images/anime_boy_pointing.png"
                alt="Anime boy pointing up"
                className="-mb-6 ml-0 h-32 w-auto object-contain sm:-mb-12 sm:ml-4 sm:h-56 md:-mb-14 md:ml-6 md:h-64"
                loading="lazy"
              />
              {!isAuthenticated ? (
                <div className="mb-2 ml-1 max-w-[280px] sm:mb-4 sm:ml-2 md:mb-6">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-[#ffd000]">
                    Join Us
                  </p>
                  <p className="mb-3 text-sm font-bold text-white/95">
                    Create your account and climb the ranks to claim the title of the ultimate anime fan.
                  </p>
                  <Link to="/register">
                    <Button size="lg" className="w-full px-7 py-4 text-lg">
                      Create Account
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-3 panel-overlap-right">
          <div className="manga-panel p-3 sm:p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf1a4f]">singleplayer</p>
            <p className="mt-2 text-sm text-base-ink/85">
              Play a classic solo run with 5 rounds and immediate score feedback after each answer.
            </p>
            <div className="mt-3">
              <Button onClick={onSoloStart} loading={soloLoading} size="sm" className="w-full sm:w-auto">
                Play
              </Button>
            </div>
          </div>
          <div className="manga-panel p-3 sm:p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#cf1a4f]">multiplayer</p>
            <p className="mt-2 text-sm text-base-ink/85">
              Jump into matchmaking and battle another player live in the same timed round set.
            </p>
            <div className="mt-3">
              <Button onClick={onMultiplayerStart} size="sm" className="w-full sm:w-auto">
                Play
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
