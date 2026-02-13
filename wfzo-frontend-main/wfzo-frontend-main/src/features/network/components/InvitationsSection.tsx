"use client";

import React, { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import { networkService } from '../services/networkService';
import type { ConnectionRequest } from '../types';

interface InvitationsSectionProps {
  onRequestHandled?: () => void;
}

const InvitationsSection: React.FC<InvitationsSectionProps> = ({ onRequestHandled }) => {
  const [invitations, setInvitations] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await networkService.getReceivedRequests(1, 10);
      
      if (response.success) {
        setInvitations(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch invitations:', err);
      setError(err.response?.data?.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await networkService.acceptConnectionRequest(requestId);
      
      if (response.success) {
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.requestId !== requestId));
        onRequestHandled?.();
      }
    } catch (err: any) {
      console.error('Failed to accept request:', err);
      alert(err.response?.data?.message || 'Failed to accept connection request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      const response = await networkService.rejectConnectionRequest(requestId);
      
      if (response.success) {
        // Remove from list
        setInvitations(prev => prev.filter(inv => inv.requestId !== requestId));
        onRequestHandled?.();
      }
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      alert(err.response?.data?.message || 'Failed to reject connection request');
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-white">
        <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
          Invitations
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wfzo-gold-600"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-white">
        <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
          Invitations
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </section>
    );
  }

  if (invitations.length === 0) {
    return (
      <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-white">
        <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
          Connection Requests
        </h2>
        <div className="bg-wfzo-gold-50 border border-wfzo-gold-200 rounded-xl p-6 text-center text-wfzo-grey-600">
          <p>No pending Connection Requests</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-white">
      <h2 className="font-montserrat text-2xl font-extrabold leading-8 text-wfzo-grey-900">
        Connection Requests
      </h2>

      <div className="flex flex-col gap-6">
        {invitations.map((invitation) => (
          <MemberCard
            key={invitation.requestId}
            member={invitation.member}
            actionType="accept-reject"
            requestId={invitation.requestId}
            onAccept={handleAccept}
            onReject={handleReject}
            note={invitation.note}
            isLoading={actionLoading === invitation.requestId}
          />
        ))}
      </div>

      {invitations.length > 3 && (
        <button className="font-source text-base font-semibold leading-5 text-wfzo-gold-600 hover:text-wfzo-gold-700 transition-colors text-center">
        View all
      </button>
      )}
    </section>
  );
};

export default InvitationsSection;
