"use client";

import React, { ReactNode } from 'react';
import RestrictedContent from '@/shared/components/RestrictedContent';
import { FEATURE_KEYS } from '@/types/membership';

interface AtlasContentWrapperProps {
  children: ReactNode;
}

export default function AtlasContentWrapper({ children }: AtlasContentWrapperProps) {
  return (
    <RestrictedContent
      featureKey={FEATURE_KEYS.KNOWLEDGE_ATLAS}
      showPreview={true}
      previewLength={400}
      showLockIcon={false}
      className="w-full"
    >
      {children}
    </RestrictedContent>
  );
}
