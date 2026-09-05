import React from 'react';
import { cn } from './Button';

export const Input = React.forwardRef(({ className, error, ...props }, ref) => {
  return (
    <div className="relative w-full">
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm',
          error && 'border-destructive focus-visible:ring-destructive/20 focus-visible:border-destructive',
          className
        )}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';

