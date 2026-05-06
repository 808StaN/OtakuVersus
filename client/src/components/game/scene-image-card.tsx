import { useEffect, useState } from 'react';

export function SceneImageCard({
  imageUrls,
  animeMeta
}: {
  imageUrls: string[];
  animeMeta: {
    year: number | null;
    genres: string[];
  } | null;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isSliding, setIsSliding] = useState(false);
  const [queuedDirection, setQueuedDirection] = useState<'left' | 'right' | null>(null);
  const tags = animeMeta?.genres?.slice(0, 4) ?? [];
  const safeImageUrls = imageUrls.length > 0 ? imageUrls : [];

  useEffect(() => {
    setCurrentIndex(0);
    setOutgoingIndex(null);
    setIsSliding(false);
    setQueuedDirection(null);
  }, [safeImageUrls.join('|')]);

  useEffect(() => {
    let cancelled = false;

    const preloadRoundImages = async () => {
      await Promise.allSettled(
        safeImageUrls.map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.src = url;

              const finalize = () => {
                if (!cancelled) {
                  resolve();
                }
              };

              if (typeof img.decode === 'function') {
                img.decode().then(finalize).catch(() => {
                  img.onload = finalize;
                  img.onerror = finalize;
                });
              } else {
                img.onload = finalize;
                img.onerror = finalize;
              }
            })
        )
      );
    };

    void preloadRoundImages();

    return () => {
      cancelled = true;
    };
  }, [safeImageUrls.join('|')]);

  useEffect(() => {
    if (!isSliding) return;

    const timeout = window.setTimeout(() => {
      setOutgoingIndex(null);
      setIsSliding(false);
    }, 320);

    return () => window.clearTimeout(timeout);
  }, [isSliding]);

  const canSlide = safeImageUrls.length > 1;

  const triggerSlide = (direction: 'left' | 'right') => {
    if (!canSlide) return;
    if (isSliding) {
      setQueuedDirection(direction);
      return;
    }

    const nextIndex =
      direction === 'right'
        ? (currentIndex + 1) % safeImageUrls.length
        : (currentIndex - 1 + safeImageUrls.length) % safeImageUrls.length;

    setSlideDirection(direction);
    setOutgoingIndex(currentIndex);
    setCurrentIndex(nextIndex);
    setIsSliding(true);
  };

  useEffect(() => {
    if (isSliding || !queuedDirection) return;
    const nextDirection = queuedDirection;
    setQueuedDirection(null);
    triggerSlide(nextDirection);
  }, [isSliding, queuedDirection]);

  return (
    <article className="manga-panel manga-panel-lift mx-auto w-full overflow-hidden p-0 sm:w-[92%] md:w-[72%]">
      <div className="relative aspect-video w-full overflow-hidden">
        {safeImageUrls.map((url, index) => {
          const isCurrent = index === currentIndex;
          const isOutgoing = index === outgoingIndex;

          if (!isCurrent && !isOutgoing) {
            return null;
          }

          let transitionClass = '';
          if (!isSliding) {
            transitionClass = isCurrent ? 'translate-x-0 opacity-100' : 'opacity-0';
          } else if (isCurrent) {
            transitionClass = slideDirection === 'right' ? 'scene-slide-enter-right' : 'scene-slide-enter-left';
          } else {
            transitionClass = slideDirection === 'right' ? 'scene-slide-exit-left' : 'scene-slide-exit-right';
          }

          return (
            <img
              key={`${url}-${index}`}
              src={url}
              alt="Anime scene"
              loading={index === currentIndex ? 'eager' : 'lazy'}
              fetchPriority={index === currentIndex ? 'high' : 'auto'}
              className={`absolute inset-0 block h-full w-full object-cover transform-gpu will-change-transform ${
                isCurrent ? 'z-20' : 'z-10'
              } ${transitionClass}`}
            />
          );
        })}

        <div className="manga-grid pointer-events-none absolute inset-0 z-20 opacity-20" />

        {canSlide ? (
          <>
            <button
              type="button"
              onClick={() => triggerSlide('left')}
              className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center border-[3px] border-black bg-[#ffd000] text-black shadow-sticker transition hover:-translate-y-[52%] hover:scale-105 active:translate-y-[-48%] sm:left-3 sm:h-11 sm:w-11"
              aria-label="Previous scene image"
            >
              <span className="font-sans text-2xl font-black leading-none">{'<'}</span>
            </button>
            <button
              type="button"
              onClick={() => triggerSlide('right')}
              className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center border-[3px] border-black bg-[#ffd000] text-black shadow-sticker transition hover:-translate-y-[52%] hover:scale-105 active:translate-y-[-48%] sm:right-3 sm:h-11 sm:w-11"
              aria-label="Next scene image"
            >
              <span className="font-sans text-2xl font-black leading-none">{'>'}</span>
            </button>
          </>
        ) : null}

        <div className="absolute left-2 right-2 top-2 z-30 flex flex-wrap gap-1.5 sm:left-3 sm:right-3 sm:top-3 sm:gap-2">
          {animeMeta?.year ? (
            <span className="border-[3px] border-black bg-[#fffdf7] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-black shadow-sticker sm:border-[4px] sm:px-3 sm:py-1 sm:text-xs">
              Year: {animeMeta.year}
            </span>
          ) : null}
          {tags.map((tag) => (
            <span
              key={tag}
              className="border-[3px] border-black bg-[#cf1a4f] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow-sticker sm:border-[4px] sm:px-3 sm:py-1 sm:text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        {canSlide ? (
          <div className="absolute bottom-2 right-2 z-30 rounded-md bg-black/45 px-2 py-1 text-xs font-black text-white sm:bottom-3 sm:right-3">
            {currentIndex + 1}/{safeImageUrls.length}
          </div>
        ) : null}
      </div>
    </article>
  );
}
