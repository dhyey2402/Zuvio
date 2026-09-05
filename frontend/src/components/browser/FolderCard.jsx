import React from 'react';
import { Folder, MoreVertical, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function FolderCard({ folder, onOpen, onContext }) {
  return (
    <div 
      className="group relative flex flex-col p-4 bg-card hover:bg-accent/30 border border-border/60 hover:border-border rounded-xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md"
      onClick={() => onOpen?.(folder)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "p-2.5 rounded-xl text-primary transition-colors",
          folder.starred ? "bg-yellow-500/10 text-yellow-500" : "bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground"
        )}>
          <Folder className="w-6 h-6 fill-current opacity-80" />
        </div>
        
        <div className="flex items-center gap-1">
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
      
      <h4 className="font-medium text-foreground truncate select-none">{folder.name}</h4>
      <p className="text-xs text-muted-foreground mt-1 select-none">Folder • {folder.date}</p>
    </div>
  );
}
