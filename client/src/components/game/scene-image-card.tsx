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
  const tags = animeMeta?.genres?.slice(0, 4) ?? [];
  const safeImageUrls = imageUrls.length > 0 ? imageUrls : [];

  useEffect(() => {
    setCurrentIndex(0);
  }, [safeImageUrls.join('|')]);

  const canSlide = safeImageUrls.length > 1;

  return (
    <article className="manga-panel manga-panel-lift mx-auto w-[88%] overflow-hidden p-0 md:w-[72%]">
      <div className="relative aspect-video w-full overflow-hidden">
        {safeImageUrls.map((url, index) => {
          const isActive = index === currentIndex;

          return (
            <img
              key={url}
              src={url}
              alt="Anime scene"
              loading="lazy"
              className={`absolute inset-0 block h-full w-full object-cover transition-all duration-500 ease-out ${
                isActive ? 'z-10 scale-100 opacity-100' : 'z-0 scale-[1.03] opacity-0'
              }`}
            />
          );
        })}

        <div className="manga-grid pointer-events-none absolute inset-0 z-20 opacity-20" />

        {canSlide ? (
          <>
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((prev) => (prev - 1 + safeImageUrls.length) % safeImageUrls.length)
              }
              className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center border-[3px] border-black bg-[#ffd000] text-black shadow-sticker transition hover:-translate-y-[52%] hover:scale-105 active:translate-y-[-48%]"
              aria-label="Previous scene image"
            >
              <span className="font-sans text-2xl font-black leading-none">{'<'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev + 1) % safeImageUrls.length)}
              className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center border-[3px] border-black bg-[#ffd000] text-black shadow-sticker transition hover:-translate-y-[52%] hover:scale-105 active:translate-y-[-48%]"
              aria-label="Next scene image"
            >
              <span className="font-sans text-2xl font-black leading-none">{'>'}</span>
            </button>
          </>
        ) : null}

        <div className="absolute left-3 top-3 z-30 flex flex-wrap gap-2">
          {animeMeta?.year ? (
            <span className="border-[4px] border-black bg-[#fffdf7] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-black shadow-sticker">
              Year: {animeMeta.year}
            </span>
          ) : null}
          {tags.map((tag) => (
            <span
              key={tag}
              className="border-[4px] border-black bg-[#cf1a4f] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white shadow-sticker"
            >
              {tag}
            </span>
          ))}
        </div>

        {canSlide ? (
          <div className="absolute bottom-3 right-3 z-30 rounded-md bg-black/45 px-2 py-1 text-xs font-black text-white">
            {currentIndex + 1}/{safeImageUrls.length}
          </div>
        ) : null}
      </div>
    </article>
  );
}
