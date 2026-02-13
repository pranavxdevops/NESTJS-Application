"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import MemberCard from './MemberCard';
import { networkService } from '../services/networkService';
import type { SuggestedMember } from '../types';

interface SuggestedMembersSectionProps {
  onConnectionSent?: () => void;
}

const SuggestedMembersSection: React.FC<SuggestedMembersSectionProps> = ({ onConnectionSent }) => {
  const [members, setMembers] = useState<SuggestedMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // Fetch only 5 members for preview
  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await networkService.getSuggestedMembers(1, 5);

      if (response.success) {
        setMembers(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch suggested members:', err);
      setError(err.response?.data?.message || 'Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMembers();
  }, []);

  const handleConnect = async (memberId: string) => {
    try {
      setActionLoading(memberId);
      const response = await networkService.sendConnectionRequest(memberId);

      if (response.success) {
        // Remove from suggestions by memberId
        setMembers(prev => prev.filter(m => m.member.memberId !== memberId));
        onConnectionSent?.();
      }
    } catch (err: any) {
      console.error('Failed to send connection request:', err);
      alert(err.response?.data?.message || 'Failed to send connection request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewAll = () => {
    router.push(`/${locale}/network/suggested-members`);
  };

  if (isLoading) {
    return (
      <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
        <h2 className="font-source text-[20px] font-normal leading-6 text-wfzo-grey-900">
          Suggested Members
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wfzo-gold-600"></div>
        </div>
      </section>
    );
  }

  if (error && members.length === 0) {
    return (
      <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
        <h2 className="font-source text-[20px] font-normal leading-6 text-wfzo-grey-900">
          Suggested Members
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </section>
    );
  }

  if (members.length === 0) {
    return (
      <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
        <h2 className="font-source text-[20px] font-normal leading-6 text-wfzo-grey-900">
          Suggested Members
        </h2>
        <div className="bg-wfzo-gold-50 border border-wfzo-gold-200 rounded-xl p-6 text-center text-wfzo-grey-600">
          <p>No suggestions available at the moment</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
      <div className="flex flex-col gap-4">
        <h2 className="font-source text-[20px] font-normal leading-6 text-wfzo-grey-900">
          Suggested Members
        </h2>

        <div className="flex flex-col gap-3">
          {members.map((suggestion, index) => (
            <React.Fragment key={suggestion.member.memberId}>
              <MemberCard
                member={suggestion.member}
                actionType="connect"
                onConnect={handleConnect}
                mutualConnections={suggestion.mutualConnections}
                matchReason={suggestion.matchReason}
                isLoading={actionLoading === suggestion.member.memberId}
              />
              {index < members.length - 1 && (
                <div className="h-px bg-wfzo-gold-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* View All Button */}
      {members.length > 0 && (
        <button 
          onClick={handleViewAll}
          className="self-start flex px-6 py-2 justify-center items-center gap-2.5 rounded-xl bg-wfzo-gold-50 font-source text-base font-semibold leading-6 text-wfzo-gold-600 hover:bg-wfzo-gold-100 transition-colors"
        >
          View all
        </button>
      )}
    </section>
  );
};

export default SuggestedMembersSection;
