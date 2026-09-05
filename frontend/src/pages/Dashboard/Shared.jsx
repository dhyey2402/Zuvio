import React from 'react';

export default function Shared() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center p-8 animate-in fade-in">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-1">Shared with you</h3>
      <p className="text-sm text-muted-foreground max-w-sm">Files and folders that others have shared with you will appear here.</p>
    </div>
  );
}
