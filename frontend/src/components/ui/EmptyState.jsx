import React from 'react';
import { Upload, FolderPlus } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ 
  title = "Your space is ready.", 
  description = "Upload your first file or create a folder to get started.",
  onUpload,
  onCreateFolder,
  icon
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8 border-2 border-dashed border-border/50 rounded-2xl bg-muted/10 animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-background shadow-sm rounded-full flex items-center justify-center mb-6">
        {icon || (
          <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8">{description}</p>
      
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {onUpload && (
          <Button onClick={onUpload} className="gap-2 w-full sm:w-auto shadow-sm">
            <Upload className="w-4 h-4" />
            Upload File
          </Button>
        )}
        {onCreateFolder && (
          <Button variant="outline" onClick={onCreateFolder} className="gap-2 w-full sm:w-auto">
            <FolderPlus className="w-4 h-4" />
            New Folder
          </Button>
        )}
      </div>
    </div>
  );
}
