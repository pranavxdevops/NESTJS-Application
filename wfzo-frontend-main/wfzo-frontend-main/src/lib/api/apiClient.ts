import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessTokenAsync } from '@/lib/auth/authClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Add JWT token to all requests (async interceptor)
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get token asynchronously
      const token = await getAccessTokenAsync();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔐 API Request with auth:', {
          url: config.url,
          method: config.method,
          hasToken: !!token,
          tokenPreview: `${token.substring(0, 30)}...`
        });
      } else {
        console.warn('⚠️ API Request without token:', {
          url: config.url,
          method: config.method
        });
      }
    } catch (error) {
      console.error('❌ Failed to get access token for API request:', error);
      // Continue without token - let the API handle unauthorized requests
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
      });
      
      // Handle specific status codes
      if (error.response.status === 401) {
        console.warn('🔒 Unauthorized - token may be expired');
        // You can add token refresh logic here or redirect to login
      }
    } else if (error.request) {
      console.error('❌ Network Error - No response received:', error.request);
    } else {
      console.error('❌ Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };
