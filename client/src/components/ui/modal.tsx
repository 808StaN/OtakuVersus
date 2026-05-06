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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-4">
      <div className="manga-panel manga-border max-h-[calc(100vh-1.5rem)] w-full max-w-xl overflow-y-auto p-4 sm:max-h-[calc(100vh-2rem)] sm:p-6">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="panel-title text-3xl text-base-ink sm:text-4xl">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="speech-bubble mt-5">{children}</div>
        {cta ? <div className="mt-6 flex justify-stretch sm:justify-end">{cta}</div> : null}
      </div>
    </div>,
    document.body
  );
}
