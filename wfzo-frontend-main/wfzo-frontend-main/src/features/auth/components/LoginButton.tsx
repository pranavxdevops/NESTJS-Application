// components/LoginButton.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { isAuthenticated, logout, login } from "@/lib/auth/authClient";

interface NavigationProps {
  locale: string;
}

export default function LoginButton({ locale }: NavigationProps) {
  const router = useRouter();
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);

  const labels = {
    en: { signIn: "Sign In", signOut: "Sign Out" },
    fr: { signIn: "Se connecter", signOut: "Se déconnecter" },
  };
  const t = labels[locale as keyof typeof labels] || labels.en;

  // Check authentication status
  useEffect(() => {
    setIsAuthenticatedState(isAuthenticated());
  }, []);

  // Handle login - redirect to hosted login page
  const handleLogin = async () => {
    try {
      console.log('🔐 Starting login...');
      await login({
        redirectUri: `${window.location.origin}/${locale}/network`,
        locale: locale === "fr" ? "fr" : "en",
      });
      
      // Update authentication state
      console.log('✅ Login completed, updating state...');
      setIsAuthenticatedState(isAuthenticated());
      
      // Refresh the page after successful login (same as logout)
      console.log('🔄 Refreshing page...');
      router.refresh();
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout...');
      await logout();
      
      // Update authentication state
      console.log('✅ Logout completed, updating state...');
      setIsAuthenticatedState(isAuthenticated());
      
      // Navigate to home and refresh
      console.log('🔄 Navigating to home and refreshing...');
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  return (
    <button
      type="button"
      aria-label="Account"
      className="p-1 text-white hover:text-wfzo-gold-200 transition cursor-pointer flex items-center gap-2"
      onClick={isAuthenticatedState ? handleLogout : handleLogin}
    >
      <Image src="/assets/account.svg" alt="Account" width={24} height={24} />
      <span className="font-source">{isAuthenticatedState ? t.signOut : t.signIn}</span>
    </button>
  );
}
