import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileBrowser } from '../../components/browser/FileBrowser';
import { PreviewModal } from '../../components/preview/PreviewModal';
import { useSearch } from '../../hooks/useSearch';
import { Search as SearchIcon, ArrowUpDown, LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SortDropdown } from '../../components/ui/SortDropdown';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'name';
  const order = searchParams.get('order') || 'asc';
  
  const [viewMode, setViewMode] = useState('grid');
  const [previewFile, setPreviewFile] = useState(null);

  const {
    folders,
    files,
    total,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearch(query, sort, order);

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', newSort);
    setSearchParams(params);
  };

  const handleOrderChange = (newOrder) => {
    const params = new URLSearchParams(searchParams);
    params.set('order', newOrder);
    setSearchParams(params);
  };

  // Initial load is true if we are fetching and we don't have any items yet
  const isInitialLoading = isFetching && folders.length === 0 && files.length === 0;
  const isEmpty = !isInitialLoading && folders.length === 0 && files.length === 0;

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <SearchIcon className="h-6 w-6 text-primary" />
            Search results
          </h1>
          {query && (
            <p className="text-sm text-muted-foreground mt-1">
              Showing results for <span className="font-semibold text-foreground">"{query}"</span>
              {!isInitialLoading && <span className="ml-2">({total} items)</span>}
            </p>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between py-2 mb-4 border-b border-border/50 pb-4">
        <SortDropdown 
          sort={sort} 
          order={order} 
          onSortChange={handleSortChange} 
          onOrderChange={handleOrderChange} 
        />

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

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 pb-8 flex flex-col">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
            <div className="w-20 h-20 bg-muted/30 border border-border/50 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <SearchIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              We couldn't find anything matching "{query}". Try another search term.
            </p>
          </div>
        ) : (
          <FileBrowser 
            folders={folders} 
            files={files} 
            viewMode={viewMode} 
            isLoading={isInitialLoading} 
            onFileClick={(file) => setPreviewFile(file)}
          />
        )}
        
        {/* Pagination / Load More */}
        {hasNextPage && !isEmpty && !isInitialLoading && (
          <div className="mt-8 flex justify-center pb-8">
            <Button 
              variant="outline" 
              onClick={() => fetchNextPage()} 
              disabled={isFetchingNextPage}
              className="px-8"
            >
              {isFetchingNextPage ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading more...</>
              ) : (
                'Load more'
              )}
            </Button>
          </div>
        )}
        
        {!hasNextPage && !isEmpty && !isInitialLoading && folders.length + files.length > 0 && (
          <div className="mt-8 text-center pb-8">
            <p className="text-xs text-muted-foreground">End of results</p>
          </div>
        )}
      </div>

      <PreviewModal 
        file={previewFile} 
        isOpen={!!previewFile} 
        onClose={() => setPreviewFile(null)} 
      />
    </div>
  );
}
