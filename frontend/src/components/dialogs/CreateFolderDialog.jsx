import React, { useState, useEffect, useRef } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function CreateFolderDialog({ isOpen, onClose, onCreate }) {
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    if (folderName.length > 255) {
      setError('Folder name is too long');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    try {
      await onCreate(folderName.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={() => !isSubmitting && onClose()} 
        aria-hidden="true"
      />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div className="flex items-center gap-3 text-foreground">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold">New Folder</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Folder name"
                disabled={isSubmitting}
                className={cn(
                  "w-full px-4 py-2.5 bg-background border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  error ? "border-red-500 focus:border-red-500" : "border-input focus:border-primary"
                )}
              />
              {error && (
                <p className="mt-2 text-sm text-red-500 animate-in slide-in-from-top-1">{error}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-8">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
