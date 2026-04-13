import { Button } from './button';

export function ErrorState({
  title,
  description,
  actionLabel,
  onRetry
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="manga-panel border-[#cf1a4f] bg-[#f5dfdf] p-8 text-center">
      <span className="ink-stamp bg-[#cf1a4f] text-white">Alert</span>
      <h3 className="panel-title mt-3 text-4xl text-[#8f1233]">{title ?? 'Something went wrong'}</h3>
      <p className="mt-2 text-base-ink/80">{description ?? 'Please try again in a moment.'}</p>
      {onRetry ? (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            {actionLabel ?? 'Retry'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}