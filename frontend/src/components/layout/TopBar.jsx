import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Bell, Plus, Search, Menu, X, Loader2 } from 'lucide-react';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { useDebounce } from '../../hooks/useDebounce';
import { useUpload } from '../../contexts/UploadContext';

export function TopBar({ onMenuClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { addUploads } = useUpload();
  const fileInputRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const initialQuery = location.pathname.includes('/dashboard/search') ? searchParams.get('q') || '' : '';
  
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 400);

  // Sync search input with URL if navigated externally
  useEffect(() => {
    if (location.pathname.includes('/dashboard/search')) {
      const q = searchParams.get('q');
      if (q !== null && q !== debouncedQuery) {
        setQuery(q);
      }
    } else {
      setQuery('');
    }
  }, [location.pathname, searchParams]);

  // Navigate when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      // Preserve sort/order if we are already on the search page
      const params = new URLSearchParams(searchParams);
      params.set('q', debouncedQuery.trim());
      navigate(`/dashboard/search?${params.toString()}`);
    } else if (location.pathname.includes('/dashboard/search') && !debouncedQuery.trim() && query === '') {
      // If we cleared the search bar, navigate back to drive
      navigate('/dashboard/drive');
    }
  }, [debouncedQuery]);

  const handleClear = () => {
    setQuery('');
    if (location.pathname.includes('/dashboard/search')) {
      navigate('/dashboard/drive');
    }
  };

  const isSearching = query !== debouncedQuery;

  return (
    <header className="h-14 md:h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-3 md:px-6 z-10 sticky top-0 transition-all">
      
      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="absolute inset-0 bg-background z-20 flex items-center px-3 gap-2 animate-in fade-in">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              autoFocus
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in Drive..."
              className="w-full h-10 pl-9 pr-10 bg-muted/50 border border-transparent focus:bg-background focus:border-border rounded-lg text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button 
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowMobileSearch(false)}
            className="p-2 text-sm text-muted-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Left side: Hamburger (Mobile) + Breadcrumbs */}
      <div className="flex-1 flex items-center min-w-0 mr-4 gap-2 md:gap-0">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumbs />
      </div>

      {/* Middle: Search */}
      <div className="flex-1 max-w-xl hidden md:flex items-center mx-4">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in Drive..."
            className="w-full h-9 pl-9 pr-12 bg-muted/50 border border-transparent hover:border-border/50 focus:bg-background focus:border-border rounded-lg text-sm transition-all outline-none placeholder:text-muted-foreground focus:shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSearching && (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin mr-1" />
            )}
            {query && !isSearching && (
              <button 
                onClick={handleClear}
                className="p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            {!query && (
              <div className="hidden lg:flex items-center gap-1 pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded text-muted-foreground">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded text-muted-foreground">K</kbd>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
        <button 
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>

        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={(e) => {
            if (e.target.files?.length) {
              addUploads(Array.from(e.target.files));
            }
            e.target.value = '';
          }}
        />

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="hidden sm:flex items-center justify-center bg-foreground text-background hover:bg-foreground/90 h-8 md:h-9 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {/* Unread badge */}
            {/* <span className="absolute top-2 right-2 w-2 h-2 bg-foreground rounded-full ring-2 ring-background"></span> */}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-8 flex flex-col items-center text-center text-muted-foreground">
                <Bell className="h-8 w-8 mb-3 opacity-20" />
                <p className="text-sm font-medium text-foreground">You're all caught up!</p>
                <p className="text-xs mt-1">Check back later for new updates.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
