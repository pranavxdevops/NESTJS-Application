"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth/authClient";
import { useAuth } from "@/lib/auth/EntraAuthProvider";

/**
 * Login Page - Redirects to Keycloak hosted login page
 */
export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = use(params);
  const locale = rawLocale || "en";
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleLogin = async () => {
      // Check if already authenticated
      if (isAuthenticated) {
        // Already logged in, redirect to profile page
        router.push(`/${locale}/profile`);
      } else {
        // Perform login
        const result = await login({
          redirectUri: `${window.location.origin}/${locale}/profile`,
          locale: locale === "fr" ? "fr" : "en",
        });
        if (result) {
          // Login successful, redirect to profile page
          router.push(`/${locale}/profile`);
        }
      }
    };

    handleLogin();
  }, [locale, router, isAuthenticated]);

  // Show loading state while redirecting to hosted login page
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}


