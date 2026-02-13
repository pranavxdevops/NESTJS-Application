'use client';

import { useEffect } from 'react';
import { setUserProperties } from '@/lib/analytics/gtag';

interface User {
  id: string;
  [key: string]: any;
}

interface Member {
  id?: string;
  membershipType?: string;
  [key: string]: any;
}

interface AuthAnalyticsProps {
  user: User | null;
  member?: Member | null;
}

export function AuthAnalytics({ user, member }: AuthAnalyticsProps) {
  useEffect(() => {
    if (user) {
      setUserProperties(
        user.id,
        member?.id,
        member?.membershipType
      );
    }
  }, [user, member]);

  return null;
}
