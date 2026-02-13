import {
  PublicClientApplication,
  Configuration,
  AccountInfo,
  AuthenticationResult,
  RedirectRequest,
  SilentRequest,
  EndSessionRequest,
  PopupRequest,
} from '@azure/msal-browser';

/**
 * Microsoft Entra ID (Azure AD) Authentication Client
 * 
 * This module provides authentication using Microsoft Entra ID with MSAL.
 * It's initialized with configuration from environment variables.
 */

let msalInstance: PublicClientApplication | null = null;
let isInitialized = false;

/**
 * Get MSAL configuration from environment variables
 */
function getMsalConfig(): Configuration {
  // Support both new and legacy environment variable names
  const clientId = process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
  const tenantId = process.env.NEXT_PUBLIC_ENTRA_TENANT_ID || process.env.NEXT_PUBLIC_AZURE_TENANT_ID;
  const tenantDomain = process.env.NEXT_PUBLIC_ENTRA_TENANT_DOMAIN;
  const tenantSubdomain = process.env.NEXT_PUBLIC_ENTRA_TENANT_SUBDOMAIN;
  const isB2C = process.env.NEXT_PUBLIC_ENTRA_IS_B2C === 'true';
  const isExternalID = process.env.NEXT_PUBLIC_ENTRA_IS_EXTERNAL_ID === 'true' || true; // Force true for testing
  const redirectUri = process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : '');
  
  console.log('🔍 Environment check:', {
    raw_NEXT_PUBLIC_ENTRA_IS_EXTERNAL_ID: process.env.NEXT_PUBLIC_ENTRA_IS_EXTERNAL_ID,
    isExternalID,
    tenantSubdomain
  });
  
  // Determine the authority URL
  let authority: string;
  let knownAuthorities: string[] | undefined;
  
  if (process.env.NEXT_PUBLIC_ENTRA_AUTHORITY) {
    // Explicit authority takes precedence
    authority = process.env.NEXT_PUBLIC_ENTRA_AUTHORITY;
  } else if (isExternalID && tenantSubdomain) {
    // Microsoft Entra External ID uses ciamlogin.com with tenant ID
    if (tenantId) {
      authority = `https://${tenantSubdomain}.ciamlogin.com/${tenantId}`;
    } else {
      authority = `https://${tenantSubdomain}.ciamlogin.com`;
    }
    knownAuthorities = [`${tenantSubdomain}.ciamlogin.com`];
  } else if (isB2C && tenantSubdomain) {
    // Azure AD B2C uses a different URL format with user flow policy
    const policyName = process.env.NEXT_PUBLIC_ENTRA_B2C_POLICY || 'B2C_1_signupsignin';
    authority = `https://${tenantSubdomain}.b2clogin.com/${tenantSubdomain}.onmicrosoft.com/${policyName}`;
    knownAuthorities = [`${tenantSubdomain}.b2clogin.com`];
  } else {
    // Regular Azure AD - use tenant ID (most reliable)
    if (tenantId) {
      authority = `https://login.microsoftonline.com/${tenantId}`;
    } else if (tenantDomain) {
      authority = `https://login.microsoftonline.com/${tenantDomain}`;
    } else {
      // Multi-tenant fallback
      authority = 'https://login.microsoftonline.com/common';
    }
  }

  if (!clientId) {
    throw new Error('NEXT_PUBLIC_ENTRA_CLIENT_ID (or NEXT_PUBLIC_AZURE_CLIENT_ID) is required for Entra authentication');
  }

  console.log('🔧 Initializing Entra with:', { 
    clientId, 
    tenantId, 
    tenantDomain, 
    tenantSubdomain,
    isB2C,
    isExternalID,
    authority, 
    knownAuthorities,
    redirectUri 
  });

  const config: Configuration = {
    auth: {
      clientId,
      authority,
      redirectUri,
      postLogoutRedirectUri: redirectUri,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case 0: // Error
              console.error(message);
              break;
            case 1: // Warning
              console.warn(message);
              break;
            case 2: // Info
              console.info(message);
              break;
            case 3: // Verbose
              console.debug(message);
              break;
          }
        },
      },
    },
  };

  return config;
}

/**
 * Get or create MSAL instance
 */
export function getMsalInstance(): PublicClientApplication | null {
  // Only run on client side
  if (typeof window === 'undefined') {
    return null;
  }

  if (!msalInstance) {
    try {
      const config = getMsalConfig();
      msalInstance = new PublicClientApplication(config);
    } catch (error) {
      console.error('Failed to initialize MSAL:', error);
      return null;
    }
  }

  return msalInstance;
}

/**
 * Initialize MSAL and handle redirect callback
 */
export async function initEntra(): Promise<boolean> {
  const msal = getMsalInstance();

  if (!msal) {
    console.error('Failed to initialize Entra: missing configuration');
    return false;
  }

  try {
    // Initialize MSAL first (required before any API calls)
    if (!isInitialized) {
      await msal.initialize();
      isInitialized = true;
      console.log('✅ MSAL initialized');
    }

    // Handle redirect promise (OAuth2 callback)
    await msal.handleRedirectPromise();

    const accounts = msal.getAllAccounts();

    if (accounts.length > 0) {
      // Set the first account as active
      msal.setActiveAccount(accounts[0]);
      console.log('✅ Entra authentication successful');
      return true;
    }

    console.log('ℹ️ User is not authenticated with Entra');
    return false;
  } catch (error) {
    console.error('❌ Entra initialization failed:', error);
    return false;
  }
}

/**
 * Ensure MSAL is initialized before operations
 */
async function ensureInitialized(): Promise<PublicClientApplication | null> {
  const msal = getMsalInstance();
  
  if (!msal) {
    return null;
  }

  if (!isInitialized) {
    try {
      await msal.initialize();
      isInitialized = true;
      console.log('✅ MSAL initialized (lazy)');
    } catch (error) {
      console.error('❌ MSAL initialization failed:', error);
      return null;
    }
  }

  return msal;
}

/**
 * Get the currently authenticated account
 */
export function getAccount(): AccountInfo | null {
  const msal = getMsalInstance();
  if (!msal) return null;

  return msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccount() !== null;
}

/**
 * Login with popup (keeps your website visible) to Microsoft Entra
 * Defaults to showing the sign-in form directly (skips account picker)
 */
export async function login(options?: {
  scopes?: string[];
  prompt?: 'login' | 'select_account' | 'consent' | 'none';
  loginHint?: string;
}): Promise<AuthenticationResult | null> {
  const msal = await ensureInitialized();

  if (!msal) {
    console.error('Entra not configured');
    return null;
  }

  // Use API scopes if available
  const apiClientId = process.env.NEXT_PUBLIC_AZURE_API_CLIENT_ID || process.env.NEXT_PUBLIC_ENTRA_API_CLIENT_ID;

  let scopes: string[];
  if (options?.scopes) {
    scopes = options.scopes;
  } else if (apiClientId) {
    // Request access to your backend API using the 'access' scope
    scopes = [
      'openid',
      'profile',
      'email',
      `api://${apiClientId}/access`
    ];
  } else {
    scopes = [
      'openid',
      'profile',
      'email',
    ];
  }

  console.log('🔐 Logging in with scopes:', scopes);

  const loginRequest: PopupRequest = {
    scopes,
    prompt: options?.prompt || 'login', // Default to 'login' to skip account picker
    loginHint: options?.loginHint,
  };

  try {
    const response = await msal.loginPopup(loginRequest);
    msal.setActiveAccount(response.account);
    console.log('✅ Entra popup login successful');
    return response;
  } catch (error) {
    console.error('❌ Entra login failed:', error);
    return null;
  }
}

/**
 * Login with popup (alternative to redirect)
 */
export async function loginPopup(options?: {
  scopes?: string[];
  prompt?: 'login' | 'select_account' | 'consent' | 'none';
  loginHint?: string;
}): Promise<AuthenticationResult | null> {
  const msal = await ensureInitialized();

  if (!msal) {
    console.error('Entra not configured');
    return null;
  }

  const scopes = options?.scopes || [
    'openid',
    'profile',
    'email',
    'User.Read',
  ];

  const loginRequest: PopupRequest = {
    scopes,
    prompt: options?.prompt,
    loginHint: options?.loginHint,
  };

  try {
    const response = await msal.loginPopup(loginRequest);
    msal.setActiveAccount(response.account);
    return response;
  } catch (error) {
    console.error('❌ Entra popup login failed:', error);
    return null;
  }
}

/**
 * Get access token silently (from cache or refresh)
 */
export async function getAccessToken(scopes?: string[]): Promise<string | null> {
  const msal = await ensureInitialized();

  if (!msal) {
    console.warn('⚠️ MSAL not initialized');
    return null;
  }

  const account = getAccount();
  if (!account) {
    console.warn('⚠️ No account found');
    return null;
  }

  // Use API scopes if available, otherwise use default scopes
  const apiClientId = process.env.NEXT_PUBLIC_AZURE_API_CLIENT_ID || process.env.NEXT_PUBLIC_ENTRA_API_CLIENT_ID;
  
  let tokenScopes: string[];
  if (scopes) {
    tokenScopes = scopes;
  } else if (apiClientId) {
    // Request access to your backend API using the 'access' scope
    tokenScopes = [`api://${apiClientId}/access`];
  } else {
    // Fallback to basic scopes
    tokenScopes = ['openid', 'profile', 'email'];
  }

  console.log('🎫 Requesting token with scopes:', tokenScopes);

  const request: SilentRequest = {
    scopes: tokenScopes,
    account,
  };

  try {
    const response = await msal.acquireTokenSilent(request);
    console.log('✅ Token acquired:', { 
      hasAccessToken: !!response.accessToken,
      scopes: response.scopes,
      expiresOn: response.expiresOn 
    });
    return response.accessToken;
  } catch (error) {
    console.error('❌ Failed to acquire token silently:', error);

    // If silent token acquisition fails, try interactive login
    try {
      const response = await msal.acquireTokenPopup(request);
      console.log('✅ Token acquired via popup');
      return response.accessToken;
    } catch (popupError) {
      console.error('Failed to acquire token with popup:', popupError);
      return null;
    }
  }
}

/**
 * Get ID token
 */
export async function getIdToken(): Promise<string | null> {
  const msal = await ensureInitialized();

  if (!msal) {
    return null;
  }

  const account = getAccount();
  if (!account) {
    return null;
  }

  return account.idToken || null;
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
  const account = getAccount();

  if (!account) {
    return {
      email: null,
      name: null,
      username: null,
      userId: null,
    };
  }

  return {
    email: account.username || null, // In Azure AD, username is typically email
    name: account.name || null,
    username: account.username || null,
    userId: account.localAccountId || account.homeAccountId || null,
  };
}

/**
 * Logout from Entra
 */
export async function logout(options?: {
  postLogoutRedirectUri?: string;
}): Promise<void> {
  const msal = await ensureInitialized();

  if (!msal) {
    console.error('Entra not configured');
    return;
  }

  const account = getAccount();

  if (!account) {
    console.warn('⚠️ No account to logout');
    return;
  }

  const logoutRequest: EndSessionRequest = {
    account: account,
    postLogoutRedirectUri: options?.postLogoutRedirectUri || window.location.origin,
  };

  try {
    // Use logoutPopup to avoid account picker confirmation
    console.log('🚪 Logging out via popup...');
    await msal.logoutPopup(logoutRequest);
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Entra logout failed:', error);
    // Fallback: clear local cache if popup fails
    clearCache();
  }
}

/**
 * Clear local cache
 */
export function clearCache(): void {
  const msal = getMsalInstance();

  if (!msal) {
    return;
  }

  const accounts = msal.getAllAccounts();
  accounts.forEach((account) => {
    msal.setActiveAccount(null);
  });

  localStorage.clear();
  sessionStorage.clear();
}
