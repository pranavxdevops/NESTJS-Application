'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/auth/authClient';

interface ProfileDropdownMenuProps {
  isAuthenticated: boolean;
  className?: string;
}

export default function ProfileDropdownMenu({ isAuthenticated, className = '' }: ProfileDropdownMenuProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reuse exact logout handler from NavigationBar.tsx
  const handleLogout = async () => {
    try {
      console.log('🚪 Starting logout...');
      const { logout } = await import('@/lib/auth/authClient');
      await logout();

      console.log('✅ Logout completed');
      setIsOpen(false);
      router.push(`/${locale}`);
      router.refresh();
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  // Reuse exact login handler from LoginButton.tsx
  const handleLogin = async () => {
    try {
      console.log('🔐 Starting login...');
      await login({
        redirectUri: `${window.location.origin}/${locale}/profile`,
        locale: locale === 'fr' ? 'fr' : 'en',
      });

      console.log('✅ Login completed');
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error('❌ Login failed:', error);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Profile Dropdown Button - matching NavigationBar style */}
      <button
        type="button"
        aria-label="Account"
        className="p-1 text-white transition cursor-pointer flex items-center gap-2 rounded-xl border border-transparent hover:border-white/40 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Image src="/assets/account.svg" alt="Account" width={24} height={24} />
        {/* Dropdown arrow - matching NavigationBar */}
        <Image
          src="/assets/dropdown_white.svg"
          alt="Dropdown"
          width={24}
          height={24}
          className={`opacity-90 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu - exact copy from NavigationBar.tsx */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[240px] bg-[#FFFFFF] rounded-xl shadow-lg overflow-hidden z-50">
          {isAuthenticated ? (
            <>
              {/* Manage Profile - exact copy from NavigationBar */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/${locale}/profile`);
                }}
                className="group w-full flex items-center gap-3 px-4 py-3
                  text-[#333333]
                  hover:bg-[#F4EEE7]
                  hover:text-[#8B6941]
                  transition-colors cursor-pointer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  className="text-[#808080] group-hover:text-[#8B6941] shrink-0"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M3.85 15.1C4.7 14.45 5.65 13.9375 6.7 13.5625C7.75 13.1875 8.85 13 10 13C11.15 13 12.25 13.1875 13.3 13.5625C14.35 13.9375 15.3 14.45 16.15 15.1C16.7333 14.4167 17.1875 13.6417 17.5125 12.775C17.8375 11.9083 18 10.9833 18 10C18 7.78333 17.2208 5.89583 15.6625 4.3375C14.1042 2.77917 12.2167 2 10 2C7.78333 2 5.89583 2.77917 4.3375 4.3375C2.77917 5.89583 2 7.78333 2 10C2 10.9833 2.1625 11.9083 2.4875 12.775C2.8125 13.6417 3.26667 14.4167 3.85 15.1ZM10 11C9.01667 11 8.1875 10.6625 7.5125 9.9875C6.8375 9.3125 6.5 8.48333 6.5 7.5C6.5 6.51667 6.8375 5.6875 7.5125 5.0125C8.1875 4.3375 9.01667 4 10 4C10.9833 4 11.8125 4.3375 12.4875 5.0125C13.1625 5.6875 13.5 6.51667 13.5 7.5C13.5 8.48333 13.1625 9.3125 12.4875 9.9875C11.8125 10.6625 10.9833 11 10 11ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C10.8833 18 11.7167 17.8708 12.5 17.6125C13.2833 17.3542 14 16.9833 14.65 16.5C14 16.0167 13.2833 15.6458 12.5 15.3875C11.7167 15.1292 10.8833 15 10 15C9.11667 15 8.28333 15.1292 7.5 15.3875C6.71667 15.6458 6 16.0167 5.35 16.5C6 16.9833 6.71667 17.3542 7.5 17.6125C8.28333 17.8708 9.11667 18 10 18ZM10 9C10.4333 9 10.7917 8.85833 11.075 8.575C11.3583 8.29167 11.5 7.93333 11.5 7.5C11.5 7.06667 11.3583 6.70833 11.075 6.425C10.7917 6.14167 10.4333 6 10 6C9.56667 6 9.20833 6.14167 8.925 6.425C8.64167 6.70833 8.5 7.06667 8.5 7.5C8.5 7.93333 8.64167 8.29167 8.925 8.575C9.20833 8.85833 9.56667 9 10 9Z" />
                </svg>
                <span className="font-source text-base font-medium">Manage Profile</span>
              </button>

              {/* Divider with 12px horizontal padding */}
              <div className="px-3">
                <div className="w-full h-[1px] bg-[#E7DACB]" />
              </div>

              {/* Sign out - exact copy from NavigationBar */}
              <button
                onClick={handleLogout}
                className="group w-full flex items-center gap-3 px-4 py-3
                  text-[#333333]
                  hover:bg-[#F4EEE7]
                  hover:text-[#8B6941]
                  transition-colors cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#808080] group-hover:text-[#8B6941] shrink-0"
                >
                  <path
                    d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H8C8.28333 0 8.52083 0.0958333 8.7125 0.2875C8.90417 0.479167 9 0.716667 9 1C9 1.28333 8.90417 1.52083 8.7125 1.7125C8.52083 1.90417 8.28333 2 8 2H2V16H8C8.28333 16 8.52083 16.0958 8.7125 16.2875C8.90417 16.4792 9 16.7167 9 17C9 17.2833 8.90417 17.5208 8.7125 17.7125C8.52083 17.9042 8.28333 18 8 18H2ZM14.175 10H7C6.71667 10 6.47917 9.90417 6.2875 9.7125C6.09583 9.52083 6 9.28333 6 9C6 8.71667 6.09583 8.47917 6.2875 8.2875C6.47917 8.09583 6.71667 8 7 8H14.175L12.3 6.125C12.1167 5.94167 12.025 5.71667 12.025 5.45C12.025 5.18333 12.1167 4.95 12.3 4.75C12.4833 4.55 12.7167 4.44583 13 4.4375C13.2833 4.42917 13.525 4.525 13.725 4.725L17.3 8.3C17.5 8.5 17.6 8.73333 17.6 9C17.6 9.26667 17.5 9.5 17.3 9.7L13.725 13.275C13.525 13.475 13.2875 13.5708 13.0125 13.5625C12.7375 13.5542 12.5 13.45 12.3 13.25C12.1167 13.05 12.0292 12.8125 12.0375 12.5375C12.0458 12.2625 12.1417 12.0333 12.325 11.85L14.175 10Z"
                    fill="currentColor"
                  />
                </svg>
                <span className="font-source text-base font-medium">Sign out</span>
              </button>
            </>
          ) : (
            /* Sign In - when not authenticated */
            <button
              onClick={handleLogin}
              className="group w-full flex items-center gap-3 px-4 py-3
                text-[#333333]
                hover:bg-[#F4EEE7]
                hover:text-[#8B6941]
                transition-colors cursor-pointer"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#808080] group-hover:text-[#8B6941] shrink-0"
              >
                <path
                  d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H8C8.28333 0 8.52083 0.0958333 8.7125 0.2875C8.90417 0.479167 9 0.716667 9 1C9 1.28333 8.90417 1.52083 8.7125 1.7125C8.52083 1.90417 8.28333 2 8 2H2V16H8C8.28333 16 8.52083 16.0958 8.7125 16.2875C8.90417 16.4792 9 16.7167 9 17C9 17.2833 8.90417 17.5208 8.7125 17.7125C8.52083 17.9042 8.28333 18 8 18H2ZM14.175 10H7C6.71667 10 6.47917 9.90417 6.2875 9.7125C6.09583 9.52083 6 9.28333 6 9C6 8.71667 6.09583 8.47917 6.2875 8.2875C6.47917 8.09583 6.71667 8 7 8H14.175L12.3 6.125C12.1167 5.94167 12.025 5.71667 12.025 5.45C12.025 5.18333 12.1167 4.95 12.3 4.75C12.4833 4.55 12.7167 4.44583 13 4.4375C13.2833 4.42917 13.525 4.525 13.725 4.725L17.3 8.3C17.5 8.5 17.6 8.73333 17.6 9C17.6 9.26667 17.5 9.5 17.3 9.7L13.725 13.275C13.525 13.475 13.2875 13.5708 13.0125 13.5625C12.7375 13.5542 12.5 13.45 12.3 13.25C12.1167 13.05 12.0292 12.8125 12.0375 12.5375C12.0458 12.2625 12.1417 12.0333 12.325 11.85L14.175 10Z"
                  fill="currentColor"
                />
              </svg>
              <span className="font-source text-base font-medium">Sign In</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
