"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/authClient";

/**
 * ProtectedRoute - Ensures user is authenticated before accessing protected pages
 * Redirects to login page if not authenticated
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      
      if (!authenticated) {
        // Redirect to login if not authenticated
        console.log("🔒 User not authenticated, redirecting to login...");
        router.push("/en/login");
      } else {
        console.log("✅ User authenticated, allowing access");
        setIsChecking(false);
      }
    };

    // Small delay to allow Keycloak to initialize
    const timer = setTimeout(checkAuth, 500);
    
    return () => clearTimeout(timer);
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wfzo-gold-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
