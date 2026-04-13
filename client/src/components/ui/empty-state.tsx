import { ReactNode } from 'react';

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="manga-panel p-8 text-center">
      <span className="ink-stamp">Empty</span>
      <h3 className="panel-title mt-3 text-4xl text-base-ink">{title}</h3>
      <p className="mt-2 text-base-ink/80">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}