"use client";

import React from 'react';
import { useMembership } from '@/lib/membership/MembershipProvider';
import { FEATURE_KEYS } from '@/types/membership';
import { LockBadge } from '@/shared/components/RestrictedContent';

interface NewsCardLockIndicatorProps {
  category?: string;
}

export default function NewsCardLockIndicator({ category }: NewsCardLockIndicatorProps) {
  const { checkFeatureAccess } = useMembership();
  
  // Determine if this is member news
  const isMemberNews = category?.toLowerCase().includes('member') || category?.toLowerCase().includes('members');
  
  if (!isMemberNews) {
    return null;
  }
  
  // Check access
  const access = checkFeatureAccess(FEATURE_KEYS.LIBRARY_MEMBER_NEWS);
  
  // Only show lock if access is restricted
  if (access.allowed) {
    return null;
  }
  
  return <LockBadge className="absolute top-4 right-4 z-10" />;
}
