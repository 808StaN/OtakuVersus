import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={cn('manga-panel manga-panel-lift p-5', className)}>{children}</article>;
}
