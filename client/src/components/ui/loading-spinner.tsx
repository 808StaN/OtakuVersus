export function LoadingGlyph({ className = 'h-5 w-5' }: { className?: string }) {
  return <div className={`mx-auto animate-spin border-[4px] border-black border-t-[#bc002d] ${className}`} />;
}

export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="manga-panel mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-10 text-base-ink">
      <LoadingGlyph className="h-6 w-6" />
      <p className="font-black uppercase tracking-[0.18em]">{label}</p>
    </div>
  );
}
