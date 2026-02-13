"use client";

import React, { ReactNode } from 'react';
import RestrictedContent from '@/shared/components/RestrictedContent';
import { FEATURE_KEYS } from '@/types/membership';

interface ArticleContentWrapperProps {
  children: ReactNode;
  category?: string;
}

export default function ArticleContentWrapper({ children, category }: ArticleContentWrapperProps) {
  // Determine if this is member news based on category
  const isMemberNews = category?.toLowerCase().includes('member') || category?.toLowerCase().includes('members');
  
  // Use appropriate feature key
  const featureKey = isMemberNews ? FEATURE_KEYS.LIBRARY_MEMBER_NEWS : FEATURE_KEYS.LIBRARY_DOWNLOADS;

  return (
    <RestrictedContent
      featureKey={featureKey}
      showPreview={true}
      previewLength={300}
      showLockIcon={false}
      className="w-full"
    >
      {children}
    </RestrictedContent>
  );
}
