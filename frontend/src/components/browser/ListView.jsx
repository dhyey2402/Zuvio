import React from 'react';
import { FolderListItem } from './FolderListItem';
import { FileListItem } from './FileListItem';
import { useContextMenu } from '../../contexts/ContextMenuContext';

export function ListView({ folders, files, onFileClick }) {
  const { openMenu } = useContextMenu();

  return (
    <div className="flex flex-col h-full bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted/30 border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
        <div className="flex-1 min-w-0 px-2">Name</div>
        <div className="flex items-center gap-6 md:gap-12 flex-shrink-0 w-1/3 justify-end md:justify-between px-2">
          <span className="hidden md:inline-block w-24">Size</span>
          <span className="hidden sm:inline-block w-24">Modified</span>
          <span className="w-12 text-right">Actions</span>
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {folders.map(folder => (
          <FolderListItem 
            key={folder.id} 
            folder={folder}
            onContext={(e) => openMenu(e, folder, 'folder')}
          />
        ))}
        
        {files.map(file => (
          <FileListItem 
            key={file.id} 
            file={file}
            onOpen={onFileClick}
            onContext={(e) => openMenu(e, file, 'file')}
          />
        ))}

        {folders.length === 0 && files.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No items to display.
          </div>
        )}
      </div>

    </div>
  );
}
