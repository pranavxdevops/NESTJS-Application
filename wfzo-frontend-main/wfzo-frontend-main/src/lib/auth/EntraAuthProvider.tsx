"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { initEntra, getMsalInstance } from "@/lib/auth/entraClient";
import { EventType } from "@azure/msal-browser";

/**
 * Auth Context
 */
export const AuthContext = createContext<{
  isAuthenticated: boolean;
  isLoading: boolean;
}>({
  isAuthenticated: false,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

/**
 * EntraAuthProvider - Initializes Microsoft Entra ID and handles authentication callbacks
 *
 * This component should wrap your application to:
 * 1. Initialize MSAL on app load
 * 2. Handle OAuth2 redirect callback
 * 3. Listen for authentication state changes (popup login)
 * 4. Make authentication state available throughout the app
 *
 * Usage:
 * Add to your root layout or wrap your app:
 *
 * ```tsx
 * <EntraAuthProvider>
 *   {children}
 * </EntraAuthProvider>
 * ```
 */
export default function EntraAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Function to check and update authentication status
  const updateAuthStatus = () => {
    const msal = getMsalInstance();
    if (msal) {
      const accounts = msal.getAllAccounts();
      const authenticated = accounts.length > 0;
      setIsAuthenticated(authenticated);
      if (authenticated && !isAuthenticated) {
        console.log("✅ Authentication state updated: authenticated");
      } else if (!authenticated && isAuthenticated) {
        console.log("❌ Authentication state updated: not authenticated");
      }
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("🔧 Initializing Microsoft Entra...");

        // Initialize MSAL and check authentication status
        const authenticated = await initEntra();

        setIsInitialized(true);
        setIsLoading(false);
        setIsAuthenticated(authenticated);

        if (authenticated) {
          console.log("✅ User is authenticated with Entra");
          
          // Clean up OAuth2 parameters from URL if present
          if (
            window.location.search.includes("code=") ||
            window.location.search.includes("state=") ||
            window.location.hash.includes("access_token")
          ) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          }
        } else {
          console.log("ℹ️ User is not authenticated with Entra");
        }

        // Add event callback for authentication changes
        const msal = getMsalInstance();
        if (msal) {
          msal.addEventCallback((event) => {
            console.log("🔄 MSAL Event:", event.eventType, event.payload);
            if (event.eventType === EventType.LOGIN_SUCCESS ||
                event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS ||
                event.eventType === EventType.ACCOUNT_ADDED ||
                event.eventType === EventType.ACCOUNT_REMOVED) {
              updateAuthStatus();
            }
          });
        }
      } catch (error) {
        console.error("❌ Entra initialization error:", error);
        setIsLoading(false);
      }
    };

    // Only initialize once
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, pathname]);

  // Listen for authentication state changes (popup login)
  useEffect(() => {
    if (!isInitialized) return;

    const msal = getMsalInstance();
    if (!msal) return;

    // Check if already authenticated on mount
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0 && !isAuthenticated) {
      console.log("✅ Found existing account on mount, updating state...");
      msal.setActiveAccount(accounts[0]);
      setIsAuthenticated(true);
    }
  }, [isInitialized, isAuthenticated]);

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
