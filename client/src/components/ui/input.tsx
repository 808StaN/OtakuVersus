import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref
) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm font-bold text-base-ink" htmlFor={id}>
      {label ? <span className="comic-kicker w-fit bg-[#ffd000]">{label}</span> : null}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-12 border-[4px] border-black bg-[#fffdf7] px-3 text-base-ink outline-none shadow-panel transition placeholder:text-base-ink/45 focus:-translate-y-[1px] focus:border-[#cf1a4f] focus:shadow-panel-hover',
          error && 'border-red-600 focus:border-red-600',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-black uppercase tracking-wide text-red-700">{error}</span> : null}
    </label>
  );
});