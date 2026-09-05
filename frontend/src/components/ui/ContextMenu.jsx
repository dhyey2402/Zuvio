import React, { useEffect, useRef } from 'react';
import { 
  FolderOpen, FileText, Download, Edit2, 
  CornerDownRight, Star, Share2, Trash2 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function ContextMenu({ isOpen, x, y, item, onClose, onAction }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isFolder = item.type === 'folder';

  const menuItems = [
    { id: 'open', label: 'Open', icon: isFolder ? FolderOpen : FileText, divider: true },
    ...(!isFolder ? [{ id: 'download', label: 'Download', icon: Download }] : []),
    { id: 'rename', label: 'Rename', icon: Edit2 },
    { id: 'move', label: 'Move to...', icon: CornerDownRight },
    { id: 'star', label: item.starred ? 'Remove from Starred' : 'Add to Starred', icon: Star, divider: true },
    { id: 'share', label: 'Share', icon: Share2, divider: true },
    { id: 'delete', label: 'Delete', icon: Trash2, danger: true },
  ];

  return (
    <div 
      ref={menuRef}
      className="fixed z-50 w-56 py-1 bg-card border border-border/80 shadow-lg rounded-xl animate-in fade-in zoom-in-95 duration-100 ease-out origin-top-left text-sm"
      style={{ top: y, left: x }}
    >
      {menuItems.map((menuItem) => (
        <React.Fragment key={menuItem.id}>
          <button
            onClick={() => {
              onAction(menuItem.id, item);
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none transition-colors",
              menuItem.danger ? "text-red-500 hover:bg-red-500/10 focus:bg-red-500/10" : "text-foreground"
            )}
          >
            <menuItem.icon className={cn("w-4 h-4", menuItem.danger ? "text-red-500" : "text-muted-foreground")} />
            {menuItem.label}
          </button>
          {menuItem.divider && <div className="h-px bg-border/60 my-1 mx-2" />}
        </React.Fragment>
      ))}
    </div>
  );
}
