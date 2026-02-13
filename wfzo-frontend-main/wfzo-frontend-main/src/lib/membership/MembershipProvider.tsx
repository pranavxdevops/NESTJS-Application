"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MembershipFeatures, EntitlementsMap, Entitlement, FeatureAccess, MEMBERSHIP_TYPES } from '@/types/membership';
import { useAuth } from '@/lib/auth/EntraAuthProvider';

interface MembershipContextValue {
  features: MembershipFeatures | null;
  isLoading: boolean;
  checkFeatureAccess: (featureKey: string) => FeatureAccess;
  hasAccess: (featureKey: string) => boolean;
  refreshFeatures: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextValue | undefined>(undefined);

export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error('useMembership must be used within a MembershipProvider');
  }
  return context;
}

interface MembershipProviderProps {
  children: ReactNode;
  initialFeatures?: MembershipFeatures; // For SSR/SSG
  membershipType?: string; // User's membership type if logged in
}

export function MembershipProvider({
  children,
  initialFeatures,
  membershipType,
}: MembershipProviderProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [features, setFeatures] = useState<MembershipFeatures | null>(initialFeatures || null);
  const [isLoading, setIsLoading] = useState(!initialFeatures);

  const fetchFeatures = async () => {
    try {
      setIsLoading(true);
      
      // Determine which membership type to fetch
      const typeToFetch = isAuthenticated && membershipType 
        ? membershipType 
        : MEMBERSHIP_TYPES.GUEST;

      const response = await fetch(`/api/membership/features/${typeToFetch}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch membership features');
      }

      const data = await response.json();
      setFeatures(data);
    } catch (error) {
      console.error('Error fetching membership features:', error);
      // Fall back to guest features on error
      if (!features) {
        try {
          const guestResponse = await fetch(`/api/membership/features/${MEMBERSHIP_TYPES.GUEST}`);
          const guestData = await guestResponse.json();
          setFeatures(guestData);
        } catch (fallbackError) {
          console.error('Failed to fetch guest features:', fallbackError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !features) {
      fetchFeatures();
    }
  }, [isAuthenticated, membershipType, authLoading]);

  // Refresh features when authentication state changes
  useEffect(() => {
    if (!authLoading) {
      fetchFeatures();
    }
  }, [isAuthenticated]);

  /**
   * Check if user has access to a specific feature
   * Returns detailed access information for UI display
   */
  const checkFeatureAccess = (featureKey: string): FeatureAccess => {
    if (!features) {
      return {
        allowed: false,
        requiresAuth: true,
        requiresUpgrade: false,
        message: 'Loading membership features...',
        upgradeUrl: '/membership/become-a-member',
      };
    }

    const entitlement: Entitlement | undefined = features.entitlements[featureKey];

    if (!entitlement) {
      // Feature not configured, deny access by default
      return {
        allowed: false,
        requiresAuth: false,
        requiresUpgrade: true,
        message: 'This feature is not available for your membership type',
        upgradeUrl: '/membership/become-a-member',
      };
    }

    const { access, authenticationRequired } = entitlement;

    // Check if authentication is required
    if (authenticationRequired && !isAuthenticated) {
      return {
        allowed: false,
        requiresAuth: true,
        requiresUpgrade: false,
        message: 'Please log in to access this feature',
        upgradeUrl: '/membership/become-a-member',
      };
    }

    // Check access level
    switch (access) {
      case 'unlimited':
        return {
          allowed: true,
          requiresAuth: false,
          requiresUpgrade: false,
        };

      case 'restricted':
        if (isAuthenticated) {
          return {
            allowed: true,
            requiresAuth: false,
            requiresUpgrade: false,
          };
        }
        return {
          allowed: false,
          requiresAuth: true,
          requiresUpgrade: false,
          message: 'This content is available to members only',
          upgradeUrl: '/membership/become-a-member',
        };

      case 'none':
        return {
          allowed: false,
          requiresAuth: false,
          requiresUpgrade: true,
          message: 'Upgrade your membership to access this feature',
          upgradeUrl: '/membership/become-a-member',
        };

      case 'payment':
      case 'approval':
        return {
          allowed: false,
          requiresAuth: isAuthenticated,
          requiresUpgrade: !isAuthenticated,
          message: access === 'payment' 
            ? 'This feature requires payment' 
            : 'This feature requires approval',
          upgradeUrl: '/membership/become-a-member',
        };

      default:
        return {
          allowed: false,
          requiresAuth: false,
          requiresUpgrade: false,
          message: 'Access not configured for this feature',
        };
    }
  };

  /**
   * Simple boolean check for feature access
   */
  const hasAccess = (featureKey: string): boolean => {
    const access = checkFeatureAccess(featureKey);
    return access.allowed;
  };

  const refreshFeatures = async () => {
    await fetchFeatures();
  };

  const value: MembershipContextValue = {
    features,
    isLoading,
    checkFeatureAccess,
    hasAccess,
    refreshFeatures,
  };

  return (
    <MembershipContext.Provider value={value}>
      {children}
    </MembershipContext.Provider>
  );
}
