import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ContextMenuContext = createContext(null);

export function ContextMenuProvider({ children }) {
  const [menuState, setMenuState] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    item: null,
    type: null, // 'file' or 'folder'
  });

  const openMenu = useCallback((e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate positioning to keep menu on screen
    const x = e.clientX;
    const y = e.clientY;
    
    setMenuState({
      isOpen: true,
      x,
      y,
      item,
      type
    });
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState(prev => prev.isOpen ? { ...prev, isOpen: false } : prev);
  }, []);

  // Close on Escape or click outside
  useEffect(() => {
    if (!menuState.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };

    const handleClick = (e) => {
      // Small delay to prevent immediate close if clicking exactly when opening
      setTimeout(closeMenu, 0);
    };

    const handleScroll = () => closeMenu();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    // window.addEventListener('scroll', handleScroll, { capture: true }); // Optional: close on scroll
    window.addEventListener('resize', closeMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      // window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', closeMenu);
    };
  }, [menuState.isOpen, closeMenu]);

  return (
    <ContextMenuContext.Provider value={{ menuState, openMenu, closeMenu }}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
}
