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

const overlayClasses: Record<ButtonVariant, string> = {
  primary: 'before:absolute before:inset-0 before:bg-speedlines before:opacity-20 before:mix-blend-multiply',
  secondary: 'before:absolute before:inset-0 before:bg-speedlines before:opacity-20 before:mix-blend-multiply',
  ghost: ''
};

const backgroundClipClasses: Record<ButtonVariant, string> = {
  primary: 'bg-clip-padding',
  secondary: 'bg-clip-padding',
  ghost: 'bg-clip-border'
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
  return (
    <button
      className={cn(
        'relative isolate inline-flex box-border items-center justify-center overflow-hidden border-[4px] font-extrabold uppercase tracking-wide shadow-panel transition duration-150 hover:-translate-x-[1px] hover:-translate-y-[3px] hover:shadow-panel-hover active:translate-y-[1px] active:shadow-panel focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        backgroundClipClasses[variant],
        overlayClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      <span className="relative z-10">{loading ? 'Loading...' : children}</span>
    </button>
  );
}
