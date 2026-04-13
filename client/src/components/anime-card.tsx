import { Card } from './ui/card';

export function AnimeCard({
  title,
  description,
  accent
}: {
  title: string;
  description: string;
  accent: 'cyan' | 'pink' | 'violet';
}) {
  const accentClass =
    accent === 'cyan'
      ? 'bg-[#ffd000] text-black'
      : accent === 'pink'
        ? 'bg-[#cf1a4f] text-white'
        : 'bg-[#ff7a00] text-white';

  return (
    <Card className="manga-cut h-full">
      <div className="flex items-center justify-between gap-3">
        <span className={`border-[4px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.14em] shadow-sticker ${accentClass}`}>
          Featured
        </span>
        <span className="ink-stamp rotate-[5deg]">Manga</span>
      </div>
      <h3 className="panel-title mt-3 text-4xl text-base-ink">{title}</h3>
      <p className="mt-2 text-base-ink/85">{description}</p>
    </Card>
  );
}