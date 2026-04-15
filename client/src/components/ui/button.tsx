import { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#ffd000] text-black border-black',
  secondary: 'bg-white text-black border-black',
  ghost: 'bg-black text-white border-black'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg'
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const loadingIndicator = (
    <span className="relative z-10 inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin border-[3px] border-black border-t-[#bc002d]" />
      <span>Loading...</span>
    </span>
  );

  return (
    <button
      className={cn(
        'relative isolate inline-flex items-center justify-center overflow-hidden border-[4px] font-extrabold uppercase tracking-wide shadow-panel transition duration-150 before:absolute before:inset-0 before:bg-speedlines before:opacity-20 before:mix-blend-multiply hover:-translate-x-[1px] hover:-translate-y-[3px] hover:shadow-panel-hover active:translate-y-[1px] active:shadow-panel focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? loadingIndicator : <span className="relative z-10">{children}</span>}
    </button>
  );
}
