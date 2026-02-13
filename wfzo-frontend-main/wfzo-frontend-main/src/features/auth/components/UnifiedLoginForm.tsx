"use client";

import { login } from "@/lib/auth/authClient";
import { useEffect } from "react";

/**
 * @deprecated No longer needed - use direct login flow instead
 * 
 * UnifiedLoginForm - Redirects to hosted login page
 * 
 * Usage:
 * ```tsx
 * import UnifiedLoginForm from "@/features/auth/components/UnifiedLoginForm";
 * 
 * export default function LoginPage() {
 *   return <UnifiedLoginForm />;
 * }
 * ```
 */
export default function UnifiedLoginForm() {
  useEffect(() => {
    // Redirect
    login();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
