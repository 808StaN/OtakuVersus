import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './button';

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  cta
}: {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  cta?: ReactNode;
}) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div className="manga-panel manga-border w-full max-w-xl p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="panel-title text-4xl text-base-ink">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="speech-bubble mt-5">{children}</div>
        {cta ? <div className="mt-6 flex justify-end">{cta}</div> : null}
      </div>
    </div>,
    document.body
  );
}
