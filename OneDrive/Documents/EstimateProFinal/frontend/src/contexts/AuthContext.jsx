import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/services/api';

export const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'globetrotter_auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from storage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthContext - Initializing auth...');
        
        // Check localStorage first
        let storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
        
        // If not in localStorage, check sessionStorage
        if (!storedAuth) {
          storedAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
        }
        
        console.log('🔐 AuthContext - Stored auth found:', !!storedAuth);
        if (storedAuth) {
          const { user: storedUser, token } = JSON.parse(storedAuth);
          console.log('🔐 AuthContext - Parsed user:', storedUser);
          console.log('🔐 AuthContext - User name:', storedUser?.name);
          console.log('🔐 AuthContext - User keys:', storedUser ? Object.keys(storedUser) : 'No user');
          console.log('🔐 AuthContext - Token found:', !!token);
          
          // Validate stored data
          if (storedUser && token) {
            // Store token separately for API calls
            localStorage.setItem('token', token);
            
            // Set initial user data without waiting for API call
            setUser({ ...storedUser, token });
            console.log('🔐 AuthContext - User set from storage');
            
            // Try to refresh user data from database in background (non-blocking)
            try {
              console.log('🔐 AuthContext - Attempting to refresh user data...');
              const freshUserData = await authApi.getProfile();
              console.log('🔐 Fresh user data loaded:', freshUserData);
              
              const authData = {
                user: freshUserData,
                token,
                timestamp: new Date().toISOString()
              };
              
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
              setUser({ ...freshUserData, token });
              console.log('🔐 AuthContext - User data refreshed successfully');
            } catch (refreshError) {
              console.warn('🔐 Could not refresh user data, keeping stored data:', refreshError);
              // Don't clear the token on refresh error - it might be a network issue
              if (refreshError.message?.includes('401') || refreshError.message?.includes('unauthorized')) {
                console.warn('🔐 Token appears to be invalid, clearing auth');
                // Clear invalid token and stored data
                localStorage.removeItem('token');
                localStorage.removeItem(AUTH_STORAGE_KEY);
                sessionStorage.removeItem(AUTH_STORAGE_KEY);
                setUser(null);
                setError('Session expired. Please login again.');
                return; // Stop execution
              } else {
                // Network error or other issue - keep the stored data
                console.warn('🔐 Network or server error, keeping stored auth data');
              }
            }
          } else {
            console.warn('🔐 Invalid stored auth data, clearing');
            // Clear invalid data
            localStorage.removeItem(AUTH_STORAGE_KEY);
            sessionStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem('token');
          }
        } else {
          console.log('🔐 No stored auth found');
        }
      } catch (err) {
        console.error('🔐 Auth initialization error:', err);
        setError('Failed to initialize authentication');
        // Clear corrupted data
        localStorage.removeItem(AUTH_STORAGE_KEY);
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
        console.log('🔐 AuthContext - Initialization complete, loading:', false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (userData, token) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate input
      if (!userData || !token) {
        throw new Error('Invalid login data');
      }

      const userWithToken = { ...userData, token };
      
      // Store the complete auth state
      const authData = {
        user: userData,
        token,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setUser(userWithToken);
      
      return userWithToken;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh user data from database
  const refreshUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // Fetch fresh user data from database using API service
      const freshUserData = await authApi.getProfile();

      // Update stored user data
      const authData = {
        user: freshUserData,
        token,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      setUser({ ...freshUserData, token });
      
      return freshUserData;
    } catch (err) {
      console.error('Error refreshing user data:', err);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      setUser(null);
      setError(null);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('token'); // Also remove the separate token
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out');
    }
  }, []);

  // Clear any auth errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        error,
        login, 
        logout,
        refreshUserData,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  try {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedAuth) return false;
    
    const { token } = JSON.parse(storedAuth);
    return !!token;
  } catch {
    return false;
  }
};

// Add default export for AuthContext
export default AuthContext;
