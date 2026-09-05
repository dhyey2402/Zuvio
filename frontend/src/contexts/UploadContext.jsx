import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { uploadService } from '../services/uploadService';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const UploadContext = createContext();

export function UploadProvider({ children }) {
  const [uploads, setUploads] = useState([]);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const queryClient = useQueryClient();
  
  // Store cancel tokens per upload ID
  const cancelTokensRef = useRef(new Map());

  // Helper to update a specific upload item
  const updateUpload = useCallback((id, updates) => {
    setUploads((prev) =>
      prev.map((upload) => (upload.id === id ? { ...upload, ...updates } : upload))
    );
  }, []);

  const processUpload = useCallback(async (uploadId, file, folderId) => {
    try {
      updateUpload(uploadId, { status: 'uploading', progress: 0 });
      
      const onProgress = (percent) => {
        updateUpload(uploadId, { progress: percent });
      };

      const source = axios.CancelToken.source();
      cancelTokensRef.current.set(uploadId, source);

      await uploadService.uploadFile(file, folderId, onProgress, source.token);
      
      updateUpload(uploadId, { status: 'completed', progress: 100 });
      cancelTokensRef.current.delete(uploadId);
      
      // Invalidate the TanStack query for this folder so the new file appears naturally
      queryClient.invalidateQueries({ queryKey: ['files', folderId || 'root'] });
      
    } catch (error) {
      if (axios.isCancel(error) || error?.message === 'Cancelled by user') {
        updateUpload(uploadId, { status: 'cancelled' });
      } else {
        updateUpload(uploadId, { status: 'failed', error: error.message || 'Upload failed' });
      }
      cancelTokensRef.current.delete(uploadId);
    }
  }, [updateUpload, queryClient]);

  const addUploads = useCallback((files, folderId = 'root') => {
    if (!files || files.length === 0) return;
    
    setIsTrayOpen(true);
    
    const newUploads = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      folderId,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'waiting', 
      progress: 0,
      error: null,
    }));
    
    setUploads((prev) => [...prev, ...newUploads]);
    
    // Start processing each new upload
    newUploads.forEach(upload => {
      processUpload(upload.id, upload.file, upload.folderId);
    });
  }, [processUpload]);

  const retryUpload = useCallback((id) => {
    const upload = uploads.find(u => u.id === id);
    if (upload && upload.status === 'failed') {
      processUpload(id, upload.file, upload.folderId);
    }
  }, [uploads, processUpload]);

  const cancelUpload = useCallback((id) => {
    const source = cancelTokensRef.current.get(id);
    if (source) {
      source.cancel('Cancelled by user');
    } else {
      updateUpload(id, { status: 'cancelled' });
    }
  }, [updateUpload]);

  const dismissUpload = useCallback((id) => {
    setUploads((prev) => prev.filter(upload => upload.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads((prev) => prev.filter(upload => upload.status !== 'completed' && upload.status !== 'cancelled'));
  }, []);

  const value = {
    uploads,
    isTrayOpen,
    setIsTrayOpen,
    addUploads,
    retryUpload,
    cancelUpload,
    dismissUpload,
    clearCompleted
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
