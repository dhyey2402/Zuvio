import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { apiClient } from '../../lib/axios';

export function PdfViewer({ file }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [url, setUrl] = useState(null);

  useEffect(() => {
    // If it's a local file object
    if (file instanceof File || file.file instanceof File) {
       setUrl(URL.createObjectURL(file.file || file));
       return;
    }

    const fetchUrl = async () => {
      try {
        const response = await apiClient.get(`/files/${file.id}`);
        if (response.data?.download_url) {
          setUrl(response.data.download_url);
        } else {
          throw new Error('No download URL available');
        }
      } catch (err) {
        console.error('Failed to fetch PDF URL', err);
        setUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
      }
    };
    
    fetchUrl();
  }, [file]);

  return (
    <div className="relative w-full h-full bg-white/5 flex flex-col">
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
          <div className="flex flex-col items-center gap-4">
             <Loader2 className="w-8 h-8 animate-spin text-white/50" />
             <span className="text-white/60 text-sm">Loading PDF...</span>
          </div>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/20">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-white/50" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">Couldn't load PDF preview</h3>
          <p className="text-white/60 mb-6 max-w-sm">
            The browser might not support direct PDF embedding, or the file is corrupted.
          </p>
          <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => window.open(url, '_blank')}>
            Download PDF
          </Button>
        </div>
      ) : url ? (
        <iframe
          src={`${url}#toolbar=0`}
          className="w-full h-full border-none shadow-2xl bg-white"
          title={file.original_filename || file.name}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      ) : null}
    </div>
  );
}
