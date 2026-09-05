import React from 'react';
import { Folder, MoreVertical, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function FolderListItem({ folder, onOpen, onContext }) {
  return (
    <div 
      className="group flex items-center justify-between p-3 bg-background hover:bg-accent/30 border-b border-border/50 last:border-0 cursor-pointer transition-colors"
      onClick={() => onOpen?.(folder)}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className={cn(
          "p-2 rounded-lg text-primary transition-colors flex-shrink-0",
          folder.starred ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground"
        )}>
          <Folder className="w-5 h-5 fill-current opacity-80" />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-medium text-foreground truncate select-none">{folder.name}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 md:gap-12 flex-shrink-0 text-sm text-muted-foreground w-1/3 justify-end md:justify-between">
        <span className="hidden md:inline-block w-24 select-none">--</span>
        <span className="hidden sm:inline-block w-24 truncate select-none">{folder.date}</span>
        
        <div className="flex items-center gap-2 w-12 justify-end">
          {folder.starred && (
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 opacity-80" />
          )}
          <button 
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onContext?.(e, folder);
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
