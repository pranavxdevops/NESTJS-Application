'use client';

import { Link } from 'i18n/navigation';
import React from 'react';
import { useAuth } from '@/lib/auth/useAuth';

export default function IncompleteProfileBanner() {
  const { member, user } = useAuth();

  if (!member || !user) {
    return null;
  }

  // Find the user snapshot for the current user
  const userSnapshot = member?.userSnapshots?.find(
    (snapshot: { email: string | null; }) => snapshot?.email === user?.email
  );

  // Only show banner for non-primary users
  const isPrimary = userSnapshot?.userType === 'Primary';
  if (!isPrimary) {
    return null;
  }

  // Only show banner if profile is incomplete
  const isIncomplete = !(member?.additionalInfo?.status === 'submitted');

  if (!isIncomplete) {
    return null;
  }

  return (
    <div>
    {isIncomplete && (
    <Link href="/profile/complete-profile" className="flex justify-between w-full border border-red-200 bg-red-50 rounded-xl px-6 py-3 cursor-pointer">
      <div className="flex items-start gap-3" >
        <span className="inline-flex items-center gap-2"></span>
        <svg
          width="17"
          height="17"
          viewBox="0 0 17 17"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.33333 0C3.73333 0 0 3.73333 0 8.33333C0 12.9333 3.73333 16.6667 8.33333 16.6667C12.9333 16.6667 16.6667 12.9333 16.6667 8.33333C16.6667 3.73333 12.9333 0 8.33333 0ZM9.16667 12.5H7.5V10.8333H9.16667V12.5ZM9.16667 9.16667H7.5V4.16667H9.16667V9.16667Z"
            fill="#D61B0A"
          />
        </svg>

        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-red-500 font-source">Incomplete profile</p>
          <p className="text-sm text-gray-800 font-source leading-5">
            Complete your profile to be able to use this platform to its full potential
          </p>
        </div>
      </div>
      <div className="pt-[2px]">
        <button
          className="text-sm font-semibold text-gray-800 font-source cursor-pointer"
        >
          Complete Profile
        </button>
      </div>
    </Link>
    )}
    </div>
  );
}
