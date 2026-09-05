import React from 'react';
import { File, Download } from 'lucide-react';
import { Button } from '../ui/Button';

export function UnsupportedViewer({ file }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full max-w-md mx-auto">
      <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/10">
        <File className="w-10 h-10 text-white/70" />
      </div>
      
      <h3 className="text-2xl font-semibold text-white mb-2 truncate w-full px-4">
        {file.name}
      </h3>
      
      <p className="text-white/50 mb-8 flex items-center gap-2 text-sm">
        <span className="uppercase tracking-wider font-medium">{file.type?.split('/')[1] || file.name.split('.').pop() || 'Unknown'} File</span>
        <span>•</span>
        <span>{file.size}</span>
      </p>

      <div className="p-4 bg-white/5 rounded-xl border border-white/10 mb-8 w-full">
        <p className="text-white/80 text-sm">
          Preview isn't available for this file type.
        </p>
      </div>

      <Button className="w-full sm:w-auto gap-2 px-8" size="lg">
        <Download className="w-4 h-4" />
        Download
      </Button>
    </div>
  );
}
