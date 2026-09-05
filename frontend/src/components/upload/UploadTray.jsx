import React, { useState } from 'react';
import { useUpload } from '../../contexts/UploadContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, File, AlertCircle, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function UploadItem({ upload }) {
  const { retryUpload, cancelUpload, dismissUpload } = useUpload();
  
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors rounded-lg group">
      {/* Icon based on status */}
      <div className="relative flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
        {upload.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : upload.status === 'failed' ? (
          <AlertCircle className="w-5 h-5 text-destructive" />
        ) : (
          <File className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium truncate pr-2 text-foreground/90">{upload.name}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
             {upload.status === 'uploading' ? `${Math.round(upload.progress)}%` : formatBytes(upload.size)}
          </span>
        </div>
        
        {/* Progress bar or status text */}
        <div className="flex items-center gap-2">
          {upload.status === 'uploading' || upload.status === 'waiting' ? (
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${upload.progress}%` }}
                transition={{ ease: "linear", duration: 0.2 }}
              />
            </div>
          ) : (
            <span className={cn(
              "text-xs font-medium",
              upload.status === 'completed' && "text-green-500",
              upload.status === 'failed' && "text-destructive",
              upload.status === 'cancelled' && "text-muted-foreground"
            )}>
              {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
              {upload.error && ` - ${upload.error}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {upload.status === 'failed' && (
          <button 
            onClick={() => retryUpload(upload.id)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
            title="Retry"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        {(upload.status === 'uploading' || upload.status === 'waiting') && (
          <button 
            onClick={() => cancelUpload(upload.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Cancel"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
        {(upload.status === 'completed' || upload.status === 'cancelled' || upload.status === 'failed') && (
          <button 
            onClick={() => dismissUpload(upload.id)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function UploadTray() {
  const { uploads, isTrayOpen, setIsTrayOpen, clearCompleted } = useUpload();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isTrayOpen || uploads.length === 0) return null;

  const activeUploadsCount = uploads.filter(u => u.status === 'uploading' || u.status === 'waiting').length;
  const completedCount = uploads.filter(u => u.status === 'completed').length;
  const failedCount = uploads.filter(u => u.status === 'failed').length;

  const headerText = activeUploadsCount > 0 
    ? `Uploading ${activeUploadsCount} item${activeUploadsCount > 1 ? 's' : ''}`
    : completedCount > 0 && failedCount === 0
      ? 'Uploads complete'
      : 'Upload manager';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl rounded-xl bg-background border border-border overflow-hidden w-80 sm:w-96">
      
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {activeUploadsCount > 0 ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent"
            />
          ) : completedCount > 0 && failedCount === 0 ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          )}
          {headerText}
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-1 hover:bg-background rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button 
            className="p-1 hover:bg-background rounded-md transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsTrayOpen(false);
              clearCompleted();
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-80 overflow-y-auto p-2 border-t border-border bg-background">
              {uploads.map(upload => (
                <UploadItem key={upload.id} upload={upload} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
