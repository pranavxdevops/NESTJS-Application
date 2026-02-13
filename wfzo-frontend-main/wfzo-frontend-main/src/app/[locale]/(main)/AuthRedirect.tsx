"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/authClient';

export default function AuthRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      console.log('✅ User authenticated, redirecting to profile page...');
      router.replace(`/${locale}/profile`);
    }
  }, [router, locale]);

  return null;
}
