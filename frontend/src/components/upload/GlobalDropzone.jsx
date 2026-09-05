import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUpload } from '../../contexts/UploadContext';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud } from 'lucide-react';

export function GlobalDropzone({ children }) {
  const { addUploads } = useUpload();

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      addUploads(acceptedFiles);
    }
  }, [addUploads]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true, // We don't want clicking anywhere to open the file dialog
    noKeyboard: true, // Same for keyboard
  });

  return (
    <div {...getRootProps()} className="relative h-full w-full outline-none">
      <input {...getInputProps()} id="global-file-input" />
      
      {/* 
        We pass the 'open' function via a hidden ref or custom event if needed elsewhere, 
        but usually we can just call it from a button directly if we use useDropzone there, 
        or we expose a trigger mechanism. For now, this just handles the drop.
      */}
      
      {children}

      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[100] m-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="flex flex-col items-center justify-center p-8 bg-background shadow-2xl rounded-2xl"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Drop files to upload</h2>
              <p className="text-muted-foreground text-center max-w-sm">
                Your files will be securely uploaded to Zuvio and instantly available across all your devices.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
