export function LoadingSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="manga-panel mx-auto flex max-w-xl flex-col items-center justify-center gap-4 py-10 text-base-ink">
      <div className="impact-burst h-16 w-16 animate-pulse border-[4px] border-black bg-[#ffd000] p-2 shadow-panel">
        <div className="h-full w-full animate-spin border-[4px] border-black border-t-[#cf1a4f]" />
      </div>
      <p className="font-black uppercase tracking-[0.18em]">{label}</p>
    </div>
  );
}