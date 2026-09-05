import React, { useState } from 'react';
import { useTrash } from '../../hooks/useTrash';
import { FileBrowser } from '../../components/browser/FileBrowser';
import { Trash2, LayoutGrid, List as ListIcon, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function Trash() {
  const [viewMode, setViewMode] = useState('grid');
  const { folders, files, isLoading } = useTrash();

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-primary" />
            Trash
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Info className="h-4 w-4" />
            Items in trash are permanently deleted after 30 days.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      {!isEmpty && (
        <div className="flex items-center justify-end py-2 mb-4 border-b border-border/50 pb-4">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="List View"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 pb-8">
        {!isLoading && isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            <div className="w-20 h-20 bg-muted/30 border border-border/50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Trash2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">Trash is empty</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Deleted files will appear here until they're permanently removed.
            </p>
          </div>
        ) : (
          <FileBrowser 
            folders={folders} 
            files={files} 
            viewMode={viewMode} 
            isLoading={isLoading} 
          />
        )}
      </div>

    </div>
  );
}
