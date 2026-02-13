/**
 * Unified Authentication Client
 * 
 * This module provides a unified interface for authentication that works
 * with either Microsoft Entra ID or no authentication based on environment configuration.
 * 
 * Set NEXT_PUBLIC_AUTH_PROVIDER to either 'entra' or 'none' in your .env file
 */
import * as EntraAuth from './entraClient';

export type AuthProvider = 'entra' | 'none';

/**
 * Get the configured auth provider from environment
 */
export function getAuthProvider(): AuthProvider {
  const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER?.toLowerCase();
  
  console.log('🔍 Auth Provider Config:', {
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    resolved: provider === 'entra' || provider === 'azure' || provider === 'msal' ? 'entra' : 
              provider === 'none' || provider === 'disabled' ? 'none' : 'entra'
  });
  
  if (provider === 'entra' || provider === 'azure' || provider === 'msal') {
    return 'entra';
  }
  
  if (provider === 'none' || provider === 'disabled') {
    return 'none';
  }
  
  // Default to Entra for backward compatibility
  return 'entra';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    return false;
  }
  
  if (provider === 'entra') {
    return EntraAuth.isAuthenticated();
  }
  return EntraAuth.isAuthenticated();
}

/**
 * Get access token for API calls
 */
export function getAccessToken(): string | null {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    return null;
  }
  
  if (provider === 'entra') {
    // For Entra, we need to use the cached token from the account
    const account = EntraAuth.getAccount();
    if (!account) return null;
    
    // Try to get access token from cache first
    // Note: This is synchronous and may not always have fresh token
    // For fresh tokens, use getAccessTokenAsync()
    return account.idToken || null;
  }
  
  return null;
}

/**
 * Get access token asynchronously (preferred method)
 */
export async function getAccessTokenAsync(): Promise<string | null> {
  const provider = getAuthProvider();
  
  console.log('🎫 Getting access token for provider:', provider);
  
  if (provider === 'none') {
    console.log('ℹ️ Auth disabled, returning null token');
    return null;
  }
  
  if (provider === 'entra') {
    const token = await EntraAuth.getAccessToken();
    console.log('🎫 Entra token retrieved:', { 
      hasToken: !!token, 
      tokenLength: token?.length,
      tokenPreview: token ? `${token.substring(0, 20)}...` : null 
    });
    return token;
  }
  
  return null;
}

/**
 * Get user profile information
 */
export function getUserProfile(): {
  email: string | null;
  name: string | null;
  username: string | null;
  userId: string | null;
} {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    return {
      email: null,
      name: null,
      username: null,
      userId: null,
    };
  }
  
  if (provider === 'entra') {
    return EntraAuth.getUserProfile();
  }
  
  return null as any;
}

/**
 * Login (redirect to auth provider)
 */
export async function login(options?: {
  redirectUri?: string;
  locale?: string;
  prompt?: string;
}): Promise<any> {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    console.log('ℹ️ Auth disabled, login skipped');
    return;
  }
  
  if (provider === 'entra') {
    return await EntraAuth.login({
      prompt: options?.prompt as any,
    });
  }

  return null;
}

/**
 * Logout (clear session and redirect)
 */
export async function logout(options?: {
  redirectUri?: string;
}): Promise<void> {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    console.log('ℹ️ Auth disabled, logout skipped');
    return;
  }
  
  if (provider === 'entra') {
    await EntraAuth.logout({
      postLogoutRedirectUri: options?.redirectUri,
    });
  } 
}

/**
 * Get ID token
 */
export async function getIdToken(): Promise<string | null> {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    return null;
  }
  
  if (provider === 'entra') {
    return await EntraAuth.getIdToken();
  }
  
  return null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    return true;
  }
  
  if (provider === 'entra') {
    const account = EntraAuth.getAccount();
    return !account;
  }
  
  return true;
}

/**
 * Update/refresh token
 */
export async function updateToken(minValidity: number = 30): Promise<boolean> {
  const provider = getAuthProvider();
  
  if (provider === 'none') {
    return false;
  }
  
  if (provider === 'entra') {
    const token = await EntraAuth.getAccessToken();
    return token !== null;
  }
  
  return false;
}
