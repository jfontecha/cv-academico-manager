import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Check if user can edit (admin or moderator) - guest users cannot edit
  const canEdit = () => {
    return user && (user.role === 'admin' || user.role === 'moderator');
  };

  // Check if user can delete (admin only) - guest users cannot delete
  const canDelete = () => {
    return user && user.role === 'admin';
  };

  // Check if user can create (admin, moderator, or user) - guest users cannot create
  const canCreate = () => {
    return user && (user.role === 'admin' || user.role === 'moderator' || user.role === 'user');
  };

  // Check if user is guest (read-only access)
  const isGuest = () => {
    return user && user.role === 'guest';
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await userAPI.login(credentials);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error en el login' 
      };
    }
  };

  // Refresh user profile function
  const refreshUserProfile = async () => {
    try {
      if (!token) return;
      
      const response = await userAPI.getProfile();
      const userData = response.data.user;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true };
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      return { success: false, message: 'Error al actualizar perfil' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setToken(savedToken);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    refreshUserProfile,
    isAdmin,
    canEdit,
    canDelete,
    canCreate,
    isGuest,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;