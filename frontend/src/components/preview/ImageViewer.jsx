import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiClient } from '../../lib/axios';

export function ImageViewer({ file }) {
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If it's a local file object (e.g. from an active upload)
    if (file instanceof File || file.file instanceof File) {
       setUrl(URL.createObjectURL(file.file || file));
       return;
    }

    // Otherwise, fetch the secure download URL from backend
    const fetchUrl = async () => {
      try {
        const response = await apiClient.get(`/files/${file.id}`);
        if (response.data?.download_url) {
          setUrl(response.data.download_url);
        } else {
          throw new Error('No download URL available');
        }
      } catch (err) {
        // Fallback to placeholder if backend fails (e.g. mock data)
        console.error('Failed to fetch image URL', err);
        setUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop');
      }
    };
    
    fetchUrl();
  }, [file]);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      )}
      
      {url && (
        <motion.img
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isLoading ? 0 : 1, scale: isLoading ? 0.9 : 1 }}
          transition={{ duration: 0.3 }}
          src={url}
          alt={file.name}
          className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
      )}
    </div>
  );
}
