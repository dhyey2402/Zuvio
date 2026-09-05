import React from 'react';
import { FolderCard } from './FolderCard';
import { FileCard } from './FileCard';
import { useContextMenu } from '../../contexts/ContextMenuContext';

export function GridView({ folders, files, onFileClick }) {
  const { openMenu } = useContextMenu();

  return (
    <div className="space-y-8 pb-8">
      
      {/* Folders Section */}
      {folders.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-4">Folders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {folders.map(folder => (
              <FolderCard 
                key={folder.id} 
                folder={folder} 
                onContext={(e) => openMenu(e, folder, 'folder')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-4">Files</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {files.map(file => (
              <FileCard 
                key={file.id} 
                file={file}
                onOpen={onFileClick}
                onContext={(e) => openMenu(e, file, 'file')}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
