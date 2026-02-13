/**
 * Auth Hook for React Components
 * 
 * Custom React hook that provides authentication state and methods.
 * Works with both Keycloak and Microsoft Entra ID.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  isAuthenticated as checkAuth,
  getUserProfile,
  login as authLogin,
  logout as authLogout,
  getAuthProvider,
} from './authClient';

export interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    email: string | null;
    name: string | null;
    username: string | null;
    userId: string | null;
  } | null;
  member: any | null; // Member data from API
  provider: 'keycloak' | 'entra' | 'none';
  login: (options?: { redirectUri?: string; locale?: string; prompt?: string }) => Promise<void>;
  logout: (options?: { redirectUri?: string }) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UseAuthReturn['user']>(null);
  const [member, setMember] = useState<any>(null);
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL!).replace(/\/$/, '');
  const targetUrl = `${API_BASE_URL}/wfzo/api/v1/member/me`
  

  const fetchMemberData = async (email: string) => {
    try {
      const response = await axios.post(targetUrl, { email });
      setMember(response.data);
    } catch (error) {
      console.error('Failed to fetch member data:', error);
      setMember(null);
    }
  };

  useEffect(() => {
    const checkAuthentication = async () => {
      const authenticated = checkAuth();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const profile = getUserProfile();
        setUser(profile);

        // Fetch member data if email is available
        if (profile?.email) {
          await fetchMemberData(profile.email);
        }
      } else {
        setUser(null);
        setMember(null);
      }

      setIsLoading(false);
    };

    checkAuthentication();

    // Listen for storage events (for multi-tab logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout' || e.key === null) {
        checkAuthentication();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (options?: { redirectUri?: string; locale?: string; prompt?: string }) => {
    await authLogin(options);
  };

  const logout = async (options?: { redirectUri?: string }) => {
    await authLogout(options);
    // Trigger logout in other tabs
    localStorage.setItem('logout', Date.now().toString());
    localStorage.removeItem('logout');
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    member,
    provider: getAuthProvider(),
    login,
    logout,
  };
}
