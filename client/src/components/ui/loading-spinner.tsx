import { Card } from './card';

export function LoadingGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return <div className={`mx-auto animate-spin border-[4px] border-black border-t-[#bc002d] ${className}`} />;
}

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <Card className="mx-auto max-w-2xl space-y-5 text-center">
      <span className="comic-kicker">Loading</span>
      <p className="text-base font-bold text-base-ink/80">{label}</p>
      <LoadingGlyph className="h-6 w-6" />
    </Card>
  );
}
