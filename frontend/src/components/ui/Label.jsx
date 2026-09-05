import React from 'react';
import { cn } from './Button';

export const Label = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground mb-1.5 block',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = 'Label';
