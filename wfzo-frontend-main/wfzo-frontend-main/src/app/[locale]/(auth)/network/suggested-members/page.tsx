'use client';

import { useState, useEffect } from 'react';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import MemberCard from '@/features/network/components/MemberCard';
import FeaturedMemberCard from '@/features/profile/components/FeaturedMemberCard';
import { networkService } from '@/features/network/services/networkService';
import type { SuggestedMember } from '@/features/network/types';
import { useParams } from 'next/navigation';

export default function SuggestedMembersPage() {
  const [suggestedMembers, setSuggestedMembers] = useState<SuggestedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    loadSuggestedMembers();
  }, []);

  const loadSuggestedMembers = async () => {
    try {
      setIsLoading(true);
      const response = await networkService.getSuggestedMembers(1, 50);
      if (response.success) {
        setSuggestedMembers(response.data);
      }
    } catch (error) {
      console.error('Failed to load suggested members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (memberId: string) => {
    try {
      setActionLoading(memberId);
      const response = await networkService.sendConnectionRequest(memberId);
      
      if (response.success) {
        // Remove from list after successful connection request
        setSuggestedMembers(prev => prev.filter(s => s.member.memberId !== memberId));
      }
    } catch (error: any) {
      console.error('Failed to send connection request:', error);
      alert(error.response?.data?.message || 'Failed to send connection request');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      {/* Hero Section */}
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/94cbf34c82049690baf3182c0bc22baaef5c5711?width=2880" />
      
      {/* Breadcrumb */}
      <div className="px-5 md:px-30 pt-10 pb-8">
        <div className="flex items-center gap-1">
          <div className="flex items-center px-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.00033 12.6667H6.00033V9.33337C6.00033 9.14449 6.06421 8.98615 6.19199 8.85837C6.31977 8.7306 6.4781 8.66671 6.66699 8.66671H9.33366C9.52255 8.66671 9.68088 8.7306 9.80866 8.85837C9.93644 8.98615 10.0003 9.14449 10.0003 9.33337V12.6667H12.0003V6.66671L8.00033 3.66671L4.00033 6.66671V12.6667ZM2.66699 12.6667V6.66671C2.66699 6.4556 2.71421 6.2556 2.80866 6.06671C2.9031 5.87782 3.03366 5.72226 3.20033 5.60004L7.20033 2.60004C7.43366 2.42226 7.70033 2.33337 8.00033 2.33337C8.30033 2.33337 8.56699 2.42226 8.80033 2.60004L12.8003 5.60004C12.967 5.72226 13.0975 5.87782 13.192 6.06671C13.2864 6.2556 13.3337 6.4556 13.3337 6.66671V12.6667C13.3337 13.0334 13.2031 13.3473 12.942 13.6084C12.6809 13.8695 12.367 14 12.0003 14H9.33366C9.14477 14 8.98644 13.9362 8.85866 13.8084C8.73088 13.6806 8.66699 13.5223 8.66699 13.3334V10H7.33366V13.3334C7.33366 13.5223 7.26977 13.6806 7.14199 13.8084C7.01421 13.9362 6.85588 14 6.66699 14H4.00033C3.63366 14 3.31977 13.8695 3.05866 13.6084C2.79755 13.3473 2.66699 13.0334 2.66699 12.6667Z" fill="#1A1A1A"/>
            </svg>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.40052 7.99999L5.80052 5.39999C5.6783 5.27777 5.61719 5.12221 5.61719 4.93333C5.61719 4.74444 5.6783 4.58888 5.80052 4.46666C5.92274 4.34444 6.0783 4.28333 6.26719 4.28333C6.45608 4.28333 6.61163 4.34444 6.73385 4.46666L9.80052 7.53333C9.86719 7.59999 9.91441 7.67221 9.94219 7.74999C9.96997 7.82777 9.98385 7.9111 9.98385 7.99999C9.98385 8.08888 9.96997 8.17221 9.94219 8.24999C9.91441 8.32777 9.86719 8.39999 9.80052 8.46666L6.73385 11.5333C6.61163 11.6555 6.45608 11.7167 6.26719 11.7167C6.0783 11.7167 5.92274 11.6555 5.80052 11.5333C5.6783 11.4111 5.61719 11.2555 5.61719 11.0667C5.61719 10.8778 5.6783 10.7222 5.80052 10.6L8.40052 7.99999Z" fill="#1A1A1A"/>
          </svg>
          <div className="flex items-center px-1">
            <span className="font-source text-xs font-normal text-wfzo-grey-900">Membership</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.40052 7.99999L5.80052 5.39999C5.6783 5.27777 5.61719 5.12221 5.61719 4.93333C5.61719 4.74444 5.6783 4.58888 5.80052 4.46666C5.92274 4.34444 6.0783 4.28333 6.26719 4.28333C6.45608 4.28333 6.61163 4.34444 6.73385 4.46666L9.80052 7.53333C9.86719 7.59999 9.91441 7.67221 9.94219 7.74999C9.96997 7.82777 9.98385 7.9111 9.98385 7.99999C9.98385 8.08888 9.96997 8.17221 9.94219 8.24999C9.91441 8.32777 9.86719 8.39999 9.80052 8.46666L6.73385 11.5333C6.61163 11.6555 6.45608 11.7167 6.26719 11.7167C6.0783 11.7167 5.92274 11.6555 5.80052 11.5333C5.6783 11.4111 5.61719 11.2555 5.61719 11.0667C5.61719 10.8778 5.6783 10.7222 5.80052 10.6L8.40052 7.99999Z" fill="#1A1A1A"/>
          </svg>
          <div className="flex items-center px-1">
            <span className="font-source text-xs font-bold text-wfzo-grey-900">Suggested Members</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 md:px-30 pb-10">
        <div className="mb-8">
          <h1 className="font-montserrat text-[32px] font-black leading-10 text-wfzo-grey-800">
            Suggested Members
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Suggested Members List */}
          <div className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-white">
            <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
              Suggested for you
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wfzo-gold-600"></div>
              </div>
            ) : suggestedMembers.length === 0 ? (
              <div className="bg-wfzo-gold-50 border border-wfzo-gold-200 rounded-xl p-6 text-center text-wfzo-grey-600">
                <p>No suggested members found</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {suggestedMembers.map((suggestion) => (
                  <MemberCard
                    key={suggestion.member.memberId}
                    member={suggestion.member}
                    actionType="connect"
                    onConnect={handleConnect}
                    isLoading={actionLoading === suggestion.member.memberId}
                    mutualConnections={suggestion.mutualConnections}
                    matchReason={suggestion.matchReason}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <FeaturedMemberCard locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
