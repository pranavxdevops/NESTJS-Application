// app/providers/AuthProvider.tsx
"use client";

import React from "react";
import EntraAuthProvider from "./EntraAuthProvider";
import { getAuthProvider } from "./authClient";

/**
 * AuthProvider - Dynamic Authentication Provider
 * 
 * Initializes authentication based on NEXT_PUBLIC_AUTH_PROVIDER environment variable.
 * Supported values:
 * - 'entra' or 'azure' - Uses Microsoft Entra ID (Azure AD) for authentication
 * - 'none' or 'disabled' - Skips authentication (useful for local development)
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const provider = getAuthProvider();
  
  console.log('🔐 AuthProvider initialized with:', provider);
  console.log('📝 Environment:', {
    NEXT_PUBLIC_AUTH_PROVIDER: process.env.NEXT_PUBLIC_AUTH_PROVIDER,
    NEXT_PUBLIC_AZURE_CLIENT_ID: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID,
    NEXT_PUBLIC_ENTRA_CLIENT_ID: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID,
  });
  
  // Skip auth if explicitly disabled
  if (provider === 'none') {
    console.log('ℹ️ Authentication disabled (local development mode)');
    return <>{children}</>;
  }
  
  if (provider === 'entra') {
    console.log('✅ Using Entra ID authentication');
    return <EntraAuthProvider>{children}</EntraAuthProvider>;
  }
  console.warn('⚠️ No valid auth provider configured, rendering children without auth provider');
  return <>{children}</>;
}