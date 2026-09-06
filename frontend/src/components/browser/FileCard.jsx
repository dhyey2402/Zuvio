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

export function FileCard({ file, onOpen, onContext }) {
  const Icon = getFileIcon(file.type);
  const colorClass = getFileColorClass(file.type);

  return (
    <div 
      className="group relative flex flex-col p-4 bg-card hover:bg-accent/30 border border-border/60 hover:border-border rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
      onClick={() => onOpen?.(file)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          colorClass
        )}>
          <Icon className="w-6 h-6 opacity-90" />
        </div>
        
        <div className="flex items-center gap-1">
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
      
      <div className="mt-auto">
        <h4 className="font-medium text-foreground truncate select-none" title={file.original_filename || file.name}>
          {file.original_filename || file.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground select-none">{file.date}</p>
          <p className="text-xs font-medium text-muted-foreground select-none">{file.size}</p>
        </div>
      </div>
    </div>
  );
}
