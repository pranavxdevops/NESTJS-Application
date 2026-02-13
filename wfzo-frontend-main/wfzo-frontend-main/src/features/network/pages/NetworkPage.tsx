"use client";

import React, { useState } from 'react';
import InvitationsSection from '../components/InvitationsSection';
import SuggestedMembersSection from '../components/SuggestedMembersSection';
import { useParams, useRouter } from 'next/navigation';
import { Users } from 'lucide-react';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import FeaturedMemberCard from '@/features/profile/components/FeaturedMemberCard';
import { useAuth } from '@/lib/auth/useAuth';
import IncompleteProfileBanner from '@/features/profile/components/IncompleteProfileBanner';


const NetworkPage: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();
  const params = useParams();
  const { user, member, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wfzo-gold-600"></div>
      </div>
    );
  }

  const userSnapshot = member?.userSnapshots?.find(
    (snapshot: { email: string | null; }) => snapshot?.email === user?.email
  );
  const isPrimary = userSnapshot?.userType === 'Primary';
  const isFeatured = member?.featuredMember || false;

  const handleRequestHandled = () => {
    // Trigger refresh of suggestions when invitation is accepted/rejected
    setRefreshKey(prev => prev + 1);
  };

  const handleConnectionSent = () => {
    // Could show a toast notification here
    console.log('Connection request sent successfully');
  };
  const locale = (params?.locale as string) || 'en';


  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      {/* Hero Section */}
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>
      <div className="px-5 md:px-30 py-10">
        <div className={`grid grid-cols-1 gap-6 ${
    isPrimary ? 'lg:grid-cols-[2fr_1fr]' : ''
  }`}>
          {/* Left Column */}
          <div className="flex flex-col gap-6">
           
            <IncompleteProfileBanner/>
            {/* Invitations Section - Only show for Primary Users */}
            {isPrimary && <InvitationsSection onRequestHandled={handleRequestHandled} />}
            
            {/* Your Connections Section */}
            <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
              <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
                Your Connections
              </h2>
              <button 
                onClick={() => router.push(`/${locale}/network/your-connections`)}
                className="flex items-center justify-between p-4 rounded-xl border border-wfzo-gold-200 bg-white hover:bg-wfzo-gold-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-wfzo-gold-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-wfzo-gold-600" />
                  </div>
                  <span className="font-source text-base font-semibold leading-5 text-wfzo-grey-800">
                    View who you've connected with
                  </span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </section>
            
            {/* Members Directory Section */}
            <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
              <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
                Members Directory
              </h2>
              <button 
                onClick={() => router.push('/membership/members-directory')}
                className="flex items-center justify-between p-4 rounded-xl border border-wfzo-gold-200 bg-white hover:bg-wfzo-gold-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-wfzo-gold-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-wfzo-gold-600" />
                  </div>
                  <span className="font-source text-base font-semibold leading-5 text-wfzo-grey-800">
                    View All Members
                  </span>
                </div>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </section>
          </div>

          {/* Right Column */}
          { isPrimary &&
          <div className="flex flex-col gap-6">
            {/* Be a Featured Member Section */}
            {!isFeatured && <FeaturedMemberCard locale={locale} />}
            
            {/* Suggested Members Section */}
            <SuggestedMembersSection
              key={refreshKey}
              onConnectionSent={handleConnectionSent}
            />
          </div>
          }
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;
