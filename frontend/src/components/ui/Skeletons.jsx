import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function FileCardSkeleton() {
  return (
    <div className="flex flex-col p-4 bg-card border border-border/60 rounded-xl h-40">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="w-8 h-8 rounded-md" />
      </div>
      <div className="mt-auto space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

export function FolderCardSkeleton() {
  return (
    <div className="flex flex-col p-4 bg-card border border-border/60 rounded-xl h-28">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-11 h-11 rounded-xl" />
        <Skeleton className="w-8 h-8 rounded-md" />
      </div>
      <Skeleton className="h-4 w-2/3 mt-1" />
      <Skeleton className="h-3 w-1/2 mt-2" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 bg-background border-b border-border/50">
      <div className="flex items-center gap-4 flex-1">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex items-center gap-6 md:gap-12 w-1/3 justify-end md:justify-between">
        <Skeleton className="hidden md:block h-4 w-16" />
        <Skeleton className="hidden sm:block h-4 w-20" />
        <Skeleton className="w-8 h-8 rounded-md mr-2" />
      </div>
    </div>
  );
}

export function FileBrowserSkeleton({ viewMode = 'grid' }) {
  if (viewMode === 'grid') {
    return (
      <div className="space-y-8 pb-8">
        <section>
          <Skeleton className="h-4 w-20 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <FolderCardSkeleton key={i} />
            ))}
          </div>
        </section>
        <section>
          <Skeleton className="h-4 w-20 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <FileCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card border border-border/50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
        <Skeleton className="h-4 w-12 ml-2" />
        <div className="flex items-center gap-6 md:gap-12 w-1/3 justify-end md:justify-between">
          <Skeleton className="hidden md:block h-4 w-10" />
          <Skeleton className="hidden sm:block h-4 w-16" />
          <Skeleton className="h-4 w-12 mr-2" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
