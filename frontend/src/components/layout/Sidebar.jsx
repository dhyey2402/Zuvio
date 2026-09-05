import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HardDrive, FolderHeart, Star, Trash2, Cloud, ChevronRight, Hexagon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'My Drive', icon: HardDrive, path: '/dashboard/drive' },
  { name: 'Shared', icon: FolderHeart, path: '/dashboard/shared' },
  { name: 'Starred', icon: Star, path: '/dashboard/starred' },
  { name: 'Trash', icon: Trash2, path: '/dashboard/trash' },
];

export function Sidebar({ className, onNavigate }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Mock storage data
  const storageUsed = 4.2; // GB
  const storageTotal = 15; // GB
  const storagePercentage = Math.round((storageUsed / storageTotal) * 100);

  const handleNav = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <aside className={cn(
      "w-64 border-r border-border bg-card flex flex-col transition-all duration-300 shadow-[1px_0_0_0_rgba(0,0,0,0.02)]",
      className
    )}>
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6">
        <Link to="/dashboard/drive" onClick={handleNav} className="flex items-center gap-2 group transition-opacity hover:opacity-80">
          <div className="h-7 w-7 bg-foreground text-background rounded flex items-center justify-center">
            <Hexagon className="h-4 w-4 fill-current" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Zuvio</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-8">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard/drive' && location.pathname === '/dashboard');
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleNav}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "text-foreground bg-muted shadow-sm" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Storage Indicator */}
        <div className="px-3 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Cloud className="h-3.5 w-3.5" />
              <span>Storage</span>
            </div>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">Free plan</span>
          </div>
          
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2 relative">
            <div 
              className="absolute top-0 left-0 h-full bg-foreground rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {storageUsed} GB of {storageTotal} GB used
          </p>
        </div>
      </div>

      {/* User Profile Area */}
      <div className="p-3">
        <button 
          onClick={logout}
          className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/60 transition-colors group text-left border border-transparent hover:border-border/50"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-medium shadow-sm flex-shrink-0 text-sm">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
              <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors">Log out</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}
