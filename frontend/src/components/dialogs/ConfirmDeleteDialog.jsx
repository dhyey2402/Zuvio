import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

export function ConfirmDeleteDialog({ isOpen, onClose, onConfirm, itemName, isDeleting, error }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => !isDeleting && onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Delete permanently?</h2>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm">
            Are you sure you want to permanently delete <span className="font-semibold text-foreground">"{itemName}"</span>? 
            This action cannot be undone.
          </p>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md animate-in fade-in duration-200">
              {error}
            </div>
          )}
        </div>

        <div className="bg-muted/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </div>
      </div>
    </div>
  );
}

