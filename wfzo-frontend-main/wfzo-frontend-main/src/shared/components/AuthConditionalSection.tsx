'use client'

import { useAuth } from '@/lib/auth/useAuth';
import { ReactNode } from 'react';

interface AuthConditionalSectionProps {
  children: ReactNode;
}

export default function AuthConditionalSection({ children }: AuthConditionalSectionProps) {
  const { user } = useAuth();

  // Render children only if user is null (not authenticated)
  if (user) {
    return null;
  }

  return <>{children}</>;
}