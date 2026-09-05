import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { UploadProvider } from './contexts/UploadContext';
import { ContextMenuProvider } from './contexts/ContextMenuContext';
import { ShareModalProvider } from './contexts/ShareModalContext';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { GlobalContextMenu } from './components/ui/GlobalContextMenu';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyDrive from './pages/Dashboard/MyDrive';
import Shared from './pages/Dashboard/Shared';
import Starred from './pages/Dashboard/Starred';
import Trash from './pages/Dashboard/Trash';
import Search from './pages/Dashboard/Search';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ContextMenuProvider>
          <ShareModalProvider>
            <UploadProvider>
              <BrowserRouter>
                <GlobalContextMenu />
                <Routes>
                  {/* Redirect root to dashboard/drive */}
                  <Route path="/" element={<Navigate to="/dashboard/drive" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/dashboard/drive" replace />} />
                  
                  {/* Auth Routes */}
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                  </Route>
                  
                  {/* Protected Dashboard Routes */}
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route path="drive" element={<MyDrive />} />
                    <Route path="shared" element={<Shared />} />
                    <Route path="starred" element={<Starred />} />
                    <Route path="trash" element={<Trash />} />
                    <Route path="search" element={<Search />} />
                  </Route>
                  
                  {/* Catch all */}
                  <Route path="*" element={<Navigate to="/dashboard/drive" replace />} />
                </Routes>
              </BrowserRouter>
            </UploadProvider>
          </ShareModalProvider>
        </ContextMenuProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
