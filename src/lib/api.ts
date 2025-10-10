// API Configuration
export const API_CONFIG = {
  // Use environment variable if available, otherwise fall back to production backend
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://uncommonattendance-backend.onrender.com/api',
  
  // Helper function to get full API URL
  getApiUrl: (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://uncommonattendance-backend.onrender.com/api';
    return `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  },
  
  // Helper function to get asset URL (for images, etc.)
  getAssetUrl: (path: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://uncommonattendance-backend.onrender.com';
    // Remove /api from base URL for assets
    const assetBaseUrl = baseUrl.replace('/api', '');
    return `${assetBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
};

// Default headers for API requests
export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// API request helper
export const apiRequest = async (endpoint: string, options: RequestInit = {}, token?: string) => {
  const url = API_CONFIG.getApiUrl(endpoint);
  const headers = {
    ...getAuthHeaders(token),
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};
