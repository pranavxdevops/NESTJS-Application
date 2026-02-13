import React from 'react';
import Link from 'next/link';
import Hero from '@/features/about/components/Hero';
import ContactSection from '@/shared/components/ContactSection';

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* <Hero /> */}

      <main>{children}</main>
    </div>
  );
}
