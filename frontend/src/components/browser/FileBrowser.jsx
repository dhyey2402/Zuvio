import React from 'react';
import { GridView } from './GridView';
import { ListView } from './ListView';
import { Loader2, Upload, FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';

export function FileBrowser({ folders, files, viewMode, isLoading, onFileClick }) {
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
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-8">
        <div className="w-24 h-24 bg-muted/30 border border-border/50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3">Your space is ready.</h3>
        <p className="text-muted-foreground max-w-sm mb-8 text-sm md:text-base">
          Upload your first file or create a folder to get started.
        </p>
        <div className="flex items-center gap-3">
          <Button className="gap-2 px-6">
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
          <Button variant="outline" className="gap-2 px-6">
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
        </div>
      </div>
    );
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
