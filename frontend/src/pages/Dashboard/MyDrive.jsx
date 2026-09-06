import React, { useState, useRef } from 'react';
import { FileBrowser } from '../../components/browser/FileBrowser';
import { PreviewModal } from '../../components/preview/PreviewModal';
import { CreateFolderDialog } from '../../components/browser/CreateFolderDialog';
import { useUpload } from '../../contexts/UploadContext';
import { useFiles } from '../../hooks/useFiles';
import { Upload, FolderPlus, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { SortDropdown } from '../../components/ui/SortDropdown';

export default function MyDrive() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [previewFile, setPreviewFile] = useState(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [sort, setSort] = useState('name');
  const [order, setOrder] = useState('asc');
  
  const { addUploads } = useUpload();
  const fileInputRef = useRef(null);
  
  // Use TanStack Query Hook with sorting
  const { folders, files, isLoading, createFolder } = useFiles('root', sort, order);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Drive</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your files and folders securely.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2" onClick={() => setIsCreateFolderOpen(true)}>
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => {
              if (e.target.files?.length) {
                addUploads(Array.from(e.target.files));
              }
              e.target.value = '';
            }}
          />
          <Button size="sm" className="gap-2 shadow-sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between py-2 mb-4 border-b border-border/50 pb-4">
        <SortDropdown 
          sort={sort} 
          order={order} 
          onSortChange={setSort} 
          onOrderChange={setOrder} 
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
      <div className="flex-1 min-h-0 pb-8">
        <FileBrowser 
          folders={folders} 
          files={files} 
          viewMode={viewMode} 
          isLoading={isLoading} 
          onFileClick={(file) => setPreviewFile(file)}
          emptyStateProps={{
            onUpload: () => fileInputRef.current?.click(),
            onCreateFolder: () => setIsCreateFolderOpen(true)
          }}
        />
      </div>

      <PreviewModal 
        file={previewFile} 
        isOpen={!!previewFile} 
        onClose={() => setPreviewFile(null)} 
      />

      <CreateFolderDialog
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={createFolder}
      />

    </div>
  );
}
