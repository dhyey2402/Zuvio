import React, { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

export function CreateFolderDialog({ isOpen, onClose, onCreate }) {
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) {
      setError('Folder name is required.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onCreate(folderName.trim());
      setFolderName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create folder.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 animate-in zoom-in-95 fade-in duration-200">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">New Folder</h2>
            <p className="text-sm text-muted-foreground">Create a new folder in this location.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-2 mb-6">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              autoFocus
              placeholder="e.g. Design Assets"
              value={folderName}
              onChange={(e) => {
                setFolderName(e.target.value);
                setError('');
              }}
              error={!!error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Folder
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
