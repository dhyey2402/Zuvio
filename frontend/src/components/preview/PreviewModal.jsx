import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Info } from 'lucide-react';
import { ImageViewer } from './ImageViewer';
import { PdfViewer } from './PdfViewer';
import { UnsupportedViewer } from './UnsupportedViewer';

export function PreviewModal({ file, isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const renderContent = () => {
    const type = file.type || '';
    if (type.startsWith('image/')) {
      return <ImageViewer file={file} />;
    } else if (type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
      return <PdfViewer file={file} />;
    } else {
      return <UnsupportedViewer file={file} />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, type: 'spring', bounce: 0 }}
            className="relative w-full h-full md:w-[90vw] md:h-[90vh] flex flex-col bg-background/5 md:rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-black/40 text-white backdrop-blur-md border-b border-white/10 z-10">
              <div className="flex items-center gap-3 truncate pr-4">
                <span className="font-medium truncate">{file.original_filename || file.name}</span>
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{file.size}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Info">
                  <Info className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Download">
                  <Download className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-white/20 mx-1" />
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors" 
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              {renderContent()}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
