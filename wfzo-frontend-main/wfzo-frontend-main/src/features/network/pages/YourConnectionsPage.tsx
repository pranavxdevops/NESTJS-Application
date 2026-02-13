"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import ConnectionCard from '../components/ConnectionCard';
import FeaturedMemberCard from '@/features/profile/components/FeaturedMemberCard';
import { networkService } from '../services/networkService';
import { chatService } from '@/services/chatService';
import type { Connection } from '../types';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/useAuth';
import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';

const YourConnectionsPage: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const { user, member } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [localMember, setLocalMember] = useState(member);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

      const userSnapshot = localMember?.userSnapshots?.find(
      (snapshot: { email: string | null; }) => snapshot?.email === user?.email
    );
  const isPrimaryUser = userSnapshot?.userType === 'Primary';
  const isFeatured = member?.featuredMember || false;
    useEffect(() => {
    setLocalMember(member); 
  }, [member]);
  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await networkService.getMyConnections(1, 100);
      if (response.success) {
        // Filter out internal team members (user's own organization)
        const externalConnections = response.data.filter(
          connection => !connection.isInternalTeam
        );
        setConnections(externalConnections);
        console.log('Loaded connections:', externalConnections);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    
    const query = searchQuery.toLowerCase();
    return connections.filter(connection => {
      const companyName = connection.member?.organisationInfo?.companyName?.toLowerCase() || '';
            console.log('Searching in connection:', connection);
      // Search in team members (secondary users)
      const secondaryUsersMatch = connection.member?.secondaryUsers?.some(user => {
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const email = user.email?.toLowerCase() || '';
        const designation = user.designation?.toLowerCase() || '';
        
        return fullName.includes(query) || 
               firstName.includes(query) || 
               lastName.includes(query) ||
               email.includes(query) ||
               designation.includes(query);
      });
      
      return companyName.includes(query) || secondaryUsersMatch;
    });
  }, [connections, searchQuery]);

  const handleBlockUser = async (userId: string, connectionId: string) => {
    try {
      // Get the member ID from the connection
      const connection = connections.find(conn => conn.connectionId === connectionId);
      if (!connection) return;
      
      const memberId = connection.member.memberId;
      const isOrganization = userId === memberId;
      
      if (isOrganization) {
        // Block the organization/member using networkService
        await networkService.blockMember(connectionId, memberId);
      } else {
        // Block specific secondary user using chatService
        await chatService.blockUser(memberId, userId);
      }
      
      // Update local state
      setConnections(prev => prev.map(conn => {
        if (conn.connectionId === connectionId) {
          if (isOrganization) {
            // Block the entire organization
            return { 
              ...conn, 
              blockStatus: 'blocked',
              member: {
                ...conn.member,
                blockStatus: 'blocked'
              }
            };
          } else {
            // Block specific secondary user
            return {
              ...conn,
              member: {
                ...conn.member,
                secondaryUsers: conn.member.secondaryUsers?.map(user =>
                  user.userId === userId ? { ...user, blockStatus: 'blocked' } : user
                ),
              },
            };
          }
        }
        return conn;
      }));
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const handleUnblockUser = async (userId: string, connectionId: string) => {
    try {
      // Get the member ID from the connection
      const connection = connections.find(conn => conn.connectionId === connectionId);
      if (!connection) return;
      
      const memberId = connection.member.memberId;
      const isOrganization = userId === memberId;
      
      if (isOrganization) {
        // Unblock the organization/member using networkService
        await networkService.unblockMember(connectionId, memberId);
      } else {
        // Unblock specific secondary user using chatService
        await chatService.unblockUser(memberId, userId);
      }
      
      // Update local state
      setConnections(prev => prev.map(conn => {
        if (conn.connectionId === connectionId) {
          if (isOrganization) {
            // Unblock the entire organization
            return { 
              ...conn, 
              blockStatus: 'none',
              member: {
                ...conn.member,
                blockStatus: 'none'
              }
            };
          } else {
            // Unblock specific secondary user
            return {
              ...conn,
              member: {
                ...conn.member,
                secondaryUsers: conn.member.secondaryUsers?.map(user =>
                  user.userId === userId ? { ...user, blockStatus: 'none' } : user
                ),
              },
            };
          }
        }
        return conn;
      }));
    } catch (error) {
      console.error('Failed to unblock user:', error);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      await networkService.removeConnection(connectionId);
      // Remove from local state
      setConnections(prev => prev.filter(conn => conn.connectionId !== connectionId));
    } catch (error) {
      console.error('Failed to remove connection:', error);
    }
  };

  const handleReport = async (memberId: string, userId: string | null, reason: string) => {
    try {
      await networkService.reportUser(memberId, userId, reason);
      // Could show a success toast here
      console.log('User/Organization reported successfully');
    } catch (error) {
      console.error('Failed to report user:', error);
    }
  };

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/", isHome: true },
    { label: "Network", href: "/network" },
    { label: "Your Connections", isCurrent: true }
  ];

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      {/* Hero Section */}
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/94cbf34c82049690baf3182c0bc22baaef5c5711?width=2880" />
      
      {/* Breadcrumb */}
      <div className="px-5 md:px-30 pt-10 pb-8">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Main Content */}
      <div className="px-5 md:px-30 pb-10">
        <div className="mb-8">
          <h1 className="font-montserrat text-[32px] font-black leading-10 text-wfzo-grey-800">
            Your Connections
          </h1>
        </div>

        <div className={`grid grid-cols-1 gap-6 ${isPrimaryUser && !isFeatured ? 'lg:grid-cols-[2fr_1fr]' : ''}`}>
          {/* Connections List */}
          <div className="flex flex-col gap-6 p-8 rounded-[20px] border border-wfzo-gold-200 bg-wfzo-gold-50">
            {/* Header with count and search */}
            <div className="flex justify-between items-center gap-4">
              <h2 className="font-source text-xl font-normal leading-6 text-wfzo-grey-900">
                {filteredConnections.length} Connection{filteredConnections.length !== 1 ? 's' : ''}
              </h2>
              
              {/* Search Field */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-wfzo-gold-400 bg-white w-full max-w-[242px]">
                <Search className="w-6 h-6 text-wfzo-grey-600 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder=""
                  className="flex-1 font-source text-base font-normal text-wfzo-grey-600 bg-transparent border-none outline-none min-w-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="flex-shrink-0"
                  >
                    <X className="w-6 h-6 text-wfzo-grey-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Connections */}
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <div className="text-center py-8 text-wfzo-grey-600">Loading connections...</div>
              ) : filteredConnections.length === 0 ? (
                <div className="text-center py-8 text-wfzo-grey-600">
                  {searchQuery ? 'No connections found matching your search.' : 'No connections yet.'}
                </div>
              ) : (
                filteredConnections.map((connection) => (
                  <ConnectionCard
                    key={connection.connectionId}
                    connection={connection}
                    onBlock={handleBlockUser}
                    onUnblock={handleUnblockUser}
                    onRemove={handleRemoveConnection}
                    onReport={handleReport}
                    searchQuery={searchQuery}
                    isPrimaryUser={isPrimaryUser}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
             {isPrimaryUser && !isFeatured && <FeaturedMemberCard locale={locale} />}
            {/* <FeaturedMemberCard locale={locale} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YourConnectionsPage;
