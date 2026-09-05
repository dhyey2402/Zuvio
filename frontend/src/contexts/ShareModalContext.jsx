import React, { createContext, useContext, useState, useCallback } from 'react';
import { ShareModal } from '../components/dialogs/ShareModal';

const ShareModalContext = createContext();

export function ShareModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    item: null,
    type: null, // 'file' or 'folder'
  });

  const openShareModal = useCallback((item, type) => {
    setModalState({
      isOpen: true,
      item,
      type,
    });
  }, []);

  const closeShareModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  return (
    <ShareModalContext.Provider value={{ openShareModal, closeShareModal }}>
      {children}
      {modalState.isOpen && modalState.item && (
        <ShareModal 
          isOpen={modalState.isOpen} 
          onClose={closeShareModal} 
          item={modalState.item} 
          type={modalState.type} 
        />
      )}
    </ShareModalContext.Provider>
  );
}

export function useShareModal() {
  const context = useContext(ShareModalContext);
  if (!context) {
    throw new Error('useShareModal must be used within a ShareModalProvider');
  }
  return context;
}
