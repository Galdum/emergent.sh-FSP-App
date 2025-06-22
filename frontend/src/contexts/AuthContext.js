import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.setAuthToken(token);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('auth_token', access_token);
      api.setAuthToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Sync local data to backend after login
      await syncLocalDataToBackend();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, password) => {
    try {
      const response = await api.register(email, password);
      const { access_token, user: userData } = response;
      
      localStorage.setItem('auth_token', access_token);
      api.setAuthToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Sync local data to backend after registration
      await syncLocalDataToBackend();
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    api.clearAuthToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const syncLocalDataToBackend = async () => {
    try {
      // Sync progress data
      const localProgress = localStorage.getItem('userProgress');
      if (localProgress) {
        const progressData = JSON.parse(localProgress);
        await api.syncProgress(progressData);
      }

      // Sync personal files (notes and links only, not file objects)
      const localFiles = localStorage.getItem('personalFileItems');
      if (localFiles) {
        const filesData = JSON.parse(localFiles);
        const syncableFiles = filesData.filter(file => file.type !== 'file');
        if (syncableFiles.length > 0) {
          await api.syncFiles(syncableFiles);
        }
      }

      console.log('Local data synced to backend successfully');
    } catch (error) {
      console.error('Failed to sync local data to backend:', error);
    }
  };

  const updateSubscription = async (tier) => {
    try {
      const updatedUser = await api.updateSubscription(tier);
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return { success: false, error: error.response?.data?.detail || 'Subscription update failed' };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateSubscription,
    syncLocalDataToBackend
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};