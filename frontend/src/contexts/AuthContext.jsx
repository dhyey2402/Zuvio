import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/axios';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await apiClient.get('/auth/me');
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      // The backend expects a JSON payload matching the UserLogin schema,
      // not OAuth2 password bearer form data.
      await apiClient.post('/auth/login', {
        email: credentials.email,
        password: credentials.password
      });
      // After successful login, get user profile
      const { data } = await apiClient.get('/auth/me');
      setUser(data);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      await apiClient.post('/auth/register', userData);
      // Auto-login after signup
      await login({ email: userData.email, password: userData.password });
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
