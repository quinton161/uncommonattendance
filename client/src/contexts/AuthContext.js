import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import LoadingScreen from '../components/ui/LoadingScreen';

const AuthContext = createContext();

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          setToken(savedToken);
          // Try to fetch user profile with saved token
          try {
            await fetchUserProfile(savedToken);
          } catch (error) {
            // If token is invalid, remove it
            localStorage.removeItem('token');
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Fetch user profile error:', error);
      // If token is invalid/expired, remove it
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Starting login for:', email);
      console.log('Making request to:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', { status: response.status, data });

      if (response.ok) {
        const { token: authToken, user: userData } = data.data;
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('token', authToken);
        toast.success('Login successful!');
      } else {
        console.error('Login failed:', data);
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('Starting registration for:', userData.email);
      
      const formData = new FormData();
      
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      if (userData.role) formData.append('role', userData.role);
      if (userData.profilePicture) formData.append('profilePicture', userData.profilePicture);

      console.log('Making request to:', `${API_BASE_URL}/auth/register`);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Registration response:', { status: response.status, data });

      if (response.ok) {
        const { token: authToken, user: newUser } = data.data;
        setToken(authToken);
        setUser(newUser);
        localStorage.setItem('token', authToken);
        toast.success('Registration successful!');
      } else {
        console.error('Registration failed:', data);
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      if (!token) throw new Error('No authentication token');

      const formData = new FormData();
      if (userData.name) formData.append('name', userData.name);
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(data.message || 'Profile update failed');
      }
    } catch (error) {
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    toast.info('Logged out successfully');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    loading,
    isAuthenticated: !!user && !!token,
  };

  // Show loading screen during initial authentication check
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
