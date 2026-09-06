import React from 'react';
import { GridView } from './GridView';
import { ListView } from './ListView';
import { Loader2, Upload, FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

export function FileBrowser({ folders, files, viewMode, isLoading, onFileClick, emptyStateProps }) {
  if (isLoading) {
    return (
      <div className="h-full space-y-8 animate-pulse p-2">
        {/* Skeleton Folders */}
        <section>
          <div className="h-4 w-16 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-28 bg-muted/40 rounded-xl border border-border/30"></div>
            ))}
          </div>
        </section>
        
        {/* Skeleton Files */}
        <section>
          <div className="h-4 w-12 bg-muted rounded mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-32 bg-muted/40 rounded-xl border border-border/30"></div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return <EmptyState {...emptyStateProps} />;
  }

  return (
    <div className="h-full animate-in fade-in duration-300">
      {viewMode === 'grid' ? (
        <GridView folders={folders} files={files} onFileClick={onFileClick} />
      ) : (
        <ListView folders={folders} files={files} onFileClick={onFileClick} />
      )}
    </div>
  );
}
