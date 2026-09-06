import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useContextMenu } from '../../contexts/ContextMenuContext';
import { useShareModal } from '../../contexts/ShareModalContext';
import { useFileActions } from '../../hooks/useFileActions';
import { useTrash } from '../../hooks/useTrash';
import { ConfirmDeleteDialog } from '../dialogs/ConfirmDeleteDialog';
import { Download, Edit2, ExternalLink, Star, Share2, Trash2, FolderOpen, FileText, RotateCcw } from 'lucide-react';
import { cn } from './Button';

export function GlobalContextMenu() {
  const { menuState, closeMenu } = useContextMenu();
  const { openShareModal } = useShareModal();
  const menuRef = useRef(null);
  
  const { softDeleteItem, toggleStarItem } = useFileActions();
  const { restoreItem, permanentDeleteItem } = useTrash();
  
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  // Store the item targeted for permanent deletion independently from context menu state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Close if we click outside the menu
  useEffect(() => {
    if (!menuState.isOpen) return;
    
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuState.isOpen, closeMenu]);

  const handleOpenConfirmDelete = useCallback(() => {
    // Capture the item and type BEFORE closing the menu
    const item = menuState.item;
    const type = menuState.type;
    if (!item) return;
    
    setDeleteTarget({ item, type });
    setDeleteError(null);
    setIsConfirmDeleteOpen(true);
    closeMenu();
  }, [menuState.item, menuState.type, closeMenu]);

  const handlePermanentDelete = useCallback(async () => {
    if (!deleteTarget?.item?.id) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await permanentDeleteItem({ id: deleteTarget.item.id });
      setIsConfirmDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      const message = error?.response?.data?.detail 
        || error?.message 
        || 'Failed to permanently delete. Please try again.';
      setDeleteError(message);
      console.error("Failed to permanently delete item:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, permanentDeleteItem]);

  const handleCloseConfirmDelete = useCallback(() => {
    if (isDeleting) return; // Don't close while delete is in progress
    setIsConfirmDeleteOpen(false);
    setDeleteTarget(null);
    setDeleteError(null);
  }, [isDeleting]);

  // Render the confirmation dialog independently — even when context menu is closed
  const confirmDialog = deleteTarget?.item && (
    <ConfirmDeleteDialog
      isOpen={isConfirmDeleteOpen}
      onClose={handleCloseConfirmDelete}
      onConfirm={handlePermanentDelete}
      itemName={deleteTarget.item.name || deleteTarget.item.original_filename}
      isDeleting={isDeleting}
      error={deleteError}
    />
  );

  // If the context menu is closed and the dialog is also closed, render nothing
  // But always render the dialog if it's open, regardless of context menu state
  if (!menuState.isOpen || !menuState.item) {
    if (isConfirmDeleteOpen && deleteTarget) {
      // Only render the dialog
      return confirmDialog;
    }
    return null;
  }

  const { x, y, item, type } = menuState;
  
  // Is this item in the trash?
  const isDeleted = !!item?.deleted_at;

  const handleSoftDelete = async () => {
    closeMenu();
    try {
      await softDeleteItem({ id: item.id, type });
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleRestore = async () => {
    closeMenu();
    try {
      await restoreItem({ id: item.id });
    } catch (error) {
      console.error("Failed to restore item:", error);
    }
  };

  // Keep menu within viewport bounds
  let adjustedX = x;
  let adjustedY = y;
  
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    if (x + rect.width > window.innerWidth) {
      adjustedX = x - rect.width;
    }
    if (y + rect.height > window.innerHeight) {
      adjustedY = y - rect.height;
    }
  }

  const isFolder = type === 'folder';

  return (
    <>
      {menuState.isOpen && (
        <div 
          ref={menuRef}
          className="fixed z-50 w-56 bg-card border border-border rounded-xl shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-left"
          style={{ top: adjustedY, left: adjustedX }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border/50 mb-1 flex items-center gap-2">
            {isFolder ? <FolderOpen className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
            <span className="text-xs font-medium truncate text-muted-foreground">{item.name || item.original_filename}</span>
          </div>

          {isDeleted ? (
            <>
              <ContextMenuItem 
                icon={<RotateCcw className="h-4 w-4" />} 
                label="Restore" 
                onClick={handleRestore} 
              />
              <div className="h-px bg-border/50 my-1.5 mx-2" />
              <ContextMenuItem 
                icon={<Trash2 className="h-4 w-4" />} 
                label="Delete permanently" 
                variant="destructive"
                onClick={handleOpenConfirmDelete} 
              />
            </>
          ) : (
            <>
              <ContextMenuItem 
                icon={<ExternalLink className="h-4 w-4" />} 
                label="Open" 
                onClick={() => {
                  console.log('Open', item.id);
                  closeMenu();
                }} 
              />
              
              {!isFolder && (
                <ContextMenuItem 
                  icon={<Download className="h-4 w-4" />} 
                  label="Download" 
                  onClick={() => {
                    console.log('Download', item.id);
                    closeMenu();
                  }} 
                />
              )}

              <div className="h-px bg-border/50 my-1.5 mx-2" />

              <ContextMenuItem 
                icon={<Edit2 className="h-4 w-4" />} 
                label="Rename" 
                onClick={() => {
                  console.log('Rename', item.id);
                  closeMenu();
                }} 
              />
              
              <ContextMenuItem 
                icon={<Share2 className="h-4 w-4" />} 
                label="Share" 
                onClick={() => {
                  openShareModal(item, type);
                  closeMenu();
                }} 
              />

              <ContextMenuItem 
                icon={<Star className={cn("h-4 w-4", item.starred ? "fill-amber-400 text-amber-400" : "")} />} 
                label={item.starred ? "Remove from Starred" : "Add to Starred"} 
                onClick={() => {
                  toggleStarItem({ id: item.id, type, currentStarState: item.starred });
                  closeMenu();
                }} 
              />

              <div className="h-px bg-border/50 my-1.5 mx-2" />

              <ContextMenuItem 
                icon={<Trash2 className="h-4 w-4" />} 
                label="Delete" 
                variant="destructive"
                onClick={handleSoftDelete} 
              />
            </>
          )}
        </div>
      )}

      {/* Confirmation Dialog — rendered independently from context menu */}
      {confirmDialog}
    </>
  );
}

function ContextMenuItem({ icon, label, onClick, variant = 'default' }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors text-left",
        variant === 'destructive' 
          ? "text-destructive hover:bg-destructive/10" 
          : "text-foreground hover:bg-accent/50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
