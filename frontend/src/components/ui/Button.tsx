import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
  primary: 'bg-terracotta text-white shadow-btn hover:brightness-[1.03] active:brightness-95',
  sage: 'bg-sage text-white shadow-[0_12px_24px_-6px_rgba(122,139,111,0.45)] hover:brightness-[1.03] active:brightness-95',
  outline: 'bg-white text-ink border border-line-button hover:bg-sand active:bg-[#F4ECDF]',
  subtle: 'bg-chip text-ink hover:brightness-[0.98] active:brightness-95',
  ghost: 'bg-transparent text-muted hover:bg-chip/60 active:bg-chip',
};

const sizes = {
  lg: 'h-[60px] px-6 text-[19px] rounded-[18px] gap-2.5',
  md: 'h-[52px] px-5 text-[17px] rounded-[16px] gap-2',
  sm: 'h-[42px] px-4 text-[15px] rounded-[13px] gap-1.5',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  block?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'lg', block, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={twMerge(clsx(
        'inline-flex items-center justify-center font-extrabold leading-none select-none',
        'transition-[filter,background-color,transform] duration-150 active:scale-[0.985]',
        'focus-visible:ring-2 focus-visible:ring-terracotta/40 focus-visible:ring-offset-2 focus-visible:ring-offset-page outline-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        block && 'w-full',
        variants[variant],
        sizes[size],
      ), className)}
      {...props}
    />
  );
});

export default Button;
