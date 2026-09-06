import React from 'react';
import { 
  File, FileText, Image as ImageIcon, Film, 
  Archive, FileSpreadsheet, MoreVertical, Star 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const getFileIcon = (type) => {
  switch (type) {
    case 'pdf': return FileText;
    case 'image': return ImageIcon;
    case 'video': return Film;
    case 'archive': return Archive;
    case 'spreadsheet': return FileSpreadsheet;
    case 'document': return FileText;
    default: return File;
  }
};

const getFileColorClass = (type) => {
  switch (type) {
    case 'pdf': return 'bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white';
    case 'image': return 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white';
    case 'video': return 'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white';
    case 'archive': return 'bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white';
    case 'spreadsheet': return 'bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white';
    case 'document': return 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white';
    default: return 'bg-gray-500/10 text-gray-500 group-hover:bg-gray-500 group-hover:text-white';
  }
};

export function FileListItem({ file, onOpen, onContext }) {
  const Icon = getFileIcon(file.type);
  const colorClass = getFileColorClass(file.type);

  return (
    <div 
      className="group flex items-center justify-between p-3 bg-background hover:bg-accent/30 border-b border-border/50 last:border-0 cursor-pointer transition-colors"
      onClick={() => onOpen?.(file)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={cn(
          "p-2 rounded-lg transition-colors flex-shrink-0",
          colorClass
        )}>
          <Icon className="w-5 h-5 opacity-90" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-medium text-foreground truncate select-none">{file.original_filename || file.name}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 md:gap-12 flex-shrink-0 text-sm text-muted-foreground w-1/3 justify-end md:justify-between">
        <span className="hidden md:inline-block w-24 select-none font-medium">{file.size}</span>
        <span className="hidden sm:inline-block w-24 truncate select-none">{file.date}</span>
        
        <div className="flex items-center gap-2 w-12 justify-end">
          {file.starred && (
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 opacity-80" />
          )}
          <button 
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onContext?.(e, file);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
