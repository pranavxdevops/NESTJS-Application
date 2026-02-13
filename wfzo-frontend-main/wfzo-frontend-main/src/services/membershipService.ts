import { MembershipFeatures, MEMBERSHIP_TYPES } from '@/types/membership';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/**
 * Fetch membership features for a specific type
 * @param type - Membership type (guest, votingMember, associateMember)
 * @param options - Optional fetch options
 * @returns Membership features
 */
export async function getMembershipFeatures(
  type: string,
  options?: RequestInit
): Promise<MembershipFeatures> {
  const url = `${API_BASE_URL}wfzo/api/v1/membership/features/${type}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Membership type '${type}' not found`);
    }
    throw new Error(`Failed to fetch membership features: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Fetch guest membership features (for unauthenticated users)
 * Cached with Next.js revalidation
 */
export async function getGuestFeatures(): Promise<MembershipFeatures> {
  return getMembershipFeatures(MEMBERSHIP_TYPES.GUEST, {
    next: {
      revalidate: 3600, // Cache for 1 hour
      tags: ['membership-features', 'guest-features'],
    },
  });
}

/**
 * Fetch user-specific membership features based on their membership type
 * @param membershipType - User's membership type from their profile
 */
export async function getUserMembershipFeatures(
  membershipType: string
): Promise<MembershipFeatures> {
  return getMembershipFeatures(membershipType, {
    next: {
      revalidate: 600, // Cache for 10 minutes
      tags: ['membership-features', `${membershipType}-features`],
    },
  });
}

/**
 * Server action to fetch membership features (for server components)
 */
export async function fetchMembershipFeaturesAction(
  type: string
): Promise<MembershipFeatures> {
  'use server';
  return getMembershipFeatures(type);
}
