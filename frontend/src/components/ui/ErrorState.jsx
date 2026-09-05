import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({ 
  title = "Something went wrong", 
  description = "We couldn't load the requested content. Please try again.",
  onRetry,
  className
}) {
  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8 bg-red-500/5 border border-red-500/20 rounded-2xl animate-in fade-in ${className || ''}`}>
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
        <AlertCircle className="w-8 h-8" />
      </div>
      
      <h3 className="text-lg font-medium mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="gap-2 border-red-500/20 hover:bg-red-500/10 text-red-500">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
