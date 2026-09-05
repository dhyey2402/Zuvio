import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const variants = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50 shadow-sm',
  ghost: 'hover:bg-accent hover:text-accent-foreground text-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-transparent',
};

export const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  isLoading = false, 
  children, 
  disabled,
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] h-10 py-2 px-4',
        variants[variant] || variants.primary,
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="h-5 w-5 animate-spin" />
        </span>
      )}
      <span className={cn('flex items-center justify-center gap-2', isLoading && 'opacity-0')}>
        {children}
      </span>
    </button>
  );
});

Button.displayName = 'Button';

