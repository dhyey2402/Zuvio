import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Hexagon } from 'lucide-react';

export function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 text-foreground animate-spin" />
      </div>
    );
  }

  // If already logged in, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Dark premium branding area */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 font-semibold text-2xl tracking-tight mb-20">
            <div className="h-8 w-8 bg-white text-zinc-950 rounded flex items-center justify-center">
              <Hexagon className="h-5 w-5 fill-current" />
            </div>
            Zuvio
          </div>
          <h1 className="text-4xl font-medium tracking-tight leading-tight max-w-lg mt-auto text-zinc-200">
            Organize your digital space.<br />
            <span className="text-zinc-500">Effortless file flow.</span>
          </h1>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-20 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 font-semibold text-xl tracking-tight mb-8">
            <div className="h-6 w-6 bg-foreground text-background rounded flex items-center justify-center">
              <Hexagon className="h-4 w-4 fill-current" />
            </div>
            Zuvio
          </div>
          
          <Outlet />
          
        </div>
      </div>
    </div>
  );
}
