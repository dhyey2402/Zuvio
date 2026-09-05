import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { GlobalDropzone } from '../upload/GlobalDropzone';
import { UploadTray } from '../upload/UploadTray';

export function DashboardLayout() {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-foreground animate-spin" />
      </div>
    );
  }

  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <GlobalDropzone>
      <div className="flex h-screen bg-background overflow-hidden text-foreground selection:bg-primary/20">
        
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex flex-shrink-0" />

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/60 animate-in fade-in duration-200"
              onClick={() => setIsMobileMenuOpen(false)} 
            />
            {/* Sidebar Drawer */}
            <div className="relative w-[280px] max-w-[80vw] h-full flex bg-background animate-in slide-in-from-left duration-300 shadow-xl">
              <Sidebar 
                className="w-full flex-shrink-0" 
                onNavigate={() => setIsMobileMenuOpen(false)} 
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative z-0">
          <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
          
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8 scroll-smooth relative">
            <div className="mx-auto max-w-7xl h-full flex flex-col">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <UploadTray />
    </GlobalDropzone>
  );
}
