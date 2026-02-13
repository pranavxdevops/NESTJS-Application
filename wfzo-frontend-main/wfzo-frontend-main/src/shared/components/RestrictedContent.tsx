"use client";

import React, { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useMembership } from '@/lib/membership/MembershipProvider';
import GoldButton from '@/shared/components/GoldButton';
import { Link } from 'i18n/navigation';

interface RestrictedContentProps {
  featureKey: string;
  children: ReactNode;
  /**
   * Content to show when access is restricted
   * If not provided, shows a default message
   */
  restrictedContent?: ReactNode;
  /**
   * Show a preview/teaser of the content even when restricted
   */
  showPreview?: boolean;
  /**
   * Preview length in characters (only used if showPreview is true)
   */
  previewLength?: number;
  /**
   * Custom class name for the container
   */
  className?: string;
  /**
   * Whether to show the lock icon overlay
   */
  showLockIcon?: boolean;
}

export default function RestrictedContent({
  featureKey,
  children,
  restrictedContent,
  showPreview = false,
  previewLength = 200,
  className = '',
  showLockIcon = true,
}: RestrictedContentProps) {
  const { checkFeatureAccess } = useMembership();
  const access = checkFeatureAccess(featureKey);

  // If user has access, show full content
  if (access.allowed) {
    return <>{children}</>;
  }

  // If restricted and showing preview
  if (showPreview) {
    return (
      <div className={`relative ${className}`}>
        {/* Lock icon overlay */}
        {showLockIcon && (
          <div className="absolute top-4 right-4 z-10 bg-wfzo-gold-500 rounded-full p-2">
            <Lock className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Preview content with fade overlay */}
        <div className="relative">
          <div className="max-h-96 overflow-hidden">
            {children}
          </div>
          
          {/* Gradient fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* Call to action */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg text-center">
          <Lock className="w-12 h-12 text-wfzo-gold-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {access.requiresAuth ? 'Member Content' : 'Premium Content'}
          </h3>
          <p className="text-gray-600 mb-4">
            {access.message || 'Become a member to read the full article'}
          </p>
          <Link href={(access.upgradeUrl || '/membership/become-a-member') as any}>
            <GoldButton>
              {access.requiresAuth ? 'Become a Member' : 'Upgrade Membership'}
            </GoldButton>
          </Link>
        </div>
      </div>
    );
  }

  // Show custom restricted content or default message
  if (restrictedContent) {
    return <div className={className}>{restrictedContent}</div>;
  }

  // Default restricted message
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <Lock className="w-16 h-16 text-wfzo-gold-500 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">
        {access.requiresAuth ? 'Member Content' : 'Premium Content'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {access.message || 'This content is available to members only'}
      </p>
      <Link href={(access.upgradeUrl || '/membership/become-a-member') as any}>
        <GoldButton>
          {access.requiresAuth ? 'Become a Member' : 'Upgrade Membership'}
        </GoldButton>
      </Link>
    </div>
  );
}

/**
 * Lock Badge Component
 * Shows a lock icon to indicate restricted content
 */
export function LockBadge({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-wfzo-gold-100 text-wfzo-gold-700 rounded-full text-sm ${className}`}>
      <Lock className="w-3 h-3" />
      <span className="font-medium">Members Only</span>
    </div>
  );
}
