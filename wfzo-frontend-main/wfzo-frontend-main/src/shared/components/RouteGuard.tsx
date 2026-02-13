"use client";

import { useEffect } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/EntraAuthProvider';

/**
 * RouteGuard - Protects routes based on authentication status
 * 
 * For (auth) routes: Redirects unauthenticated users to home
 * For (main) routes: Allows both authenticated and unauthenticated users
 * Special case: Auto-redirects authenticated users to profile only if they didn't intentionally navigate to main website
 */
export default function RouteGuard({ isProtected }: { isProtected: boolean }) {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    // Clear the main website flag when user signs out
    if (!isAuthenticated) {
      sessionStorage.removeItem('allowMainWebsite');
    }

    if (isProtected && !isAuthenticated) {
      // Protected route but not authenticated - redirect to home
      console.log('⚠️ Unauthenticated user trying to access protected route, redirecting to home...');
      router.replace(`/${locale}`);
    } else if (!isProtected && isAuthenticated && pathname === `/${locale}`) {
      // Check if user intentionally navigated to main website
      const allowMainWebsite = sessionStorage.getItem('allowMainWebsite');
      
      console.log('🔍 RouteGuard check - pathname:', pathname, 'allowMainWebsite:', allowMainWebsite);
      
      if (allowMainWebsite !== 'true') {
        // User landed on main website without clicking "Main Website" button - redirect to profile
        console.log('✅ Authenticated user on home page without flag, redirecting to profile page...');
        router.replace(`/${locale}/profile`);
      } else {
        // User clicked "Main Website" button - allow them to stay
        console.log('✅ User intentionally navigated to main website, allowing access...');
      }
    } else if (isProtected && pathname !== `/${locale}`) {
      // User is on a protected page (not main website) - clear the flag
      sessionStorage.removeItem('allowMainWebsite');
    }
  }, [router, locale, pathname, isProtected, isAuthenticated]);

  return null;
}
