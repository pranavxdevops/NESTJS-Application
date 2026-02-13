"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Connection, TeamMember } from '../types';
import ConnectionActionsMenu from './ConnectionActionsMenu';
import ReportBlockModal from './ReportBlockModal';
import RemoveConnectionModal from './RemoveConnectionModal';

interface ConnectionCardProps {
  connection: Connection;
  onBlock: (userId: string, connectionId: string) => void;
  onUnblock: (userId: string, connectionId: string) => void;
  onRemove: (connectionId: string) => void;
  onReport: (memberId: string, userId: string | null, reason: string) => void;
  searchQuery?: string;
  isPrimaryUser?: boolean;
}

const ConnectionCard: React.FC<ConnectionCardProps> = ({
  connection,
  onBlock,
  onUnblock,
  onRemove,
  onReport,
  searchQuery = '',
  isPrimaryUser = true, // Default to true for backward compatibility
}) => {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showTeamMemberMenu, setShowTeamMemberMenu] = useState<string | null>(null);
  const [showReportBlockModal, setShowReportBlockModal] = useState<{
    isOpen: boolean;
    userId: string;
    memberId: string;
    connectionId: string;
    isBlocked: boolean;
    isOrganization: boolean;
    name?: string;
  }>({ isOpen: false, userId: '', memberId: '', connectionId: '', isBlocked: false, isOrganization: false, name: '' });
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const companyName = connection.member?.organisationInfo?.companyName || 'Organization';
  const logoUrl = connection.member?.organisationInfo?.memberLogoUrl;
  console.log('Connection Team Members:', connection);
  const allTeamMembers = connection?.member?.secondaryUsers|| [];
  const isOrgBlocked = connection?.member?.blockStatus === 'blocked';
  
  // Determine if search matches company or only team members
  const searchMatchType = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return 'none';
    }
    
    const query = searchQuery.toLowerCase();
    const companyMatches = companyName.toLowerCase().includes(query);
    
    if (companyMatches) {
      return 'company';
    }
    
    const hasTeamMemberMatch = allTeamMembers.some(user => {
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
    
    return hasTeamMemberMatch ? 'teamMember' : 'none';
  }, [searchQuery, companyName, allTeamMembers]);
  
  // Filter team members based on search query
  const teamMembers = React.useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) {
      return allTeamMembers;
    }
    
    const query = searchQuery.toLowerCase();
    
    // If company name matches, show all team members
    if (searchMatchType === 'company') {
      return allTeamMembers;
    }
    
    // Otherwise, filter to only matching team members
    return allTeamMembers.filter(user => {
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
  }, [allTeamMembers, searchQuery, searchMatchType]);
  
  // Auto-expand if searching and a team member matches
  useEffect(() => {
    if (searchMatchType === 'teamMember' && teamMembers.length > 0) {
      // Always expand when only team members match
      setIsExpanded(true);
    } else if (!searchQuery || !searchQuery.trim()) {
      // Collapse when search is cleared
      setIsExpanded(false);
    }
  }, [searchQuery, teamMembers, searchMatchType]);
  
  const handleMessage = (teamMember?: TeamMember) => {
    // Check if organization or specific team member is blocked
    const isBlocked = isOrgBlocked || (teamMember?.blockStatus === 'blocked') || (teamMember?.isBlocked || false);
    
    if (isBlocked) {
      return; // Don't allow messaging if blocked
    }
    
    // Navigate to inbox with the selected user/member
    if (teamMember) {
      // Chat with specific team member
      const chatData = {
        type: 'user',
        memberId: connection.member.memberId,
        companyName: companyName,
        logo: logoUrl,
        user: {
          firstName: teamMember.firstName,
          lastName: teamMember.lastName,
          designation: teamMember.designation,
          userLogoUrl: teamMember.userLogoUrl,
        },
      };
      sessionStorage.setItem('openChat', JSON.stringify(chatData));
    } else {
      // Chat with organization
      const chatData = {
        type: 'member',
        memberId: connection.member.memberId,
        companyName: companyName,
        logo: logoUrl,
      };
      sessionStorage.setItem('openChat', JSON.stringify(chatData));
    }
    
    router.push(`/${locale}/inbox`);
  };

  const handleOrgMenuAction = (action: 'remove' | 'report-block' | 'report-unblock') => {
    setShowOrgMenu(false);
    if (action === 'remove') {
      setShowRemoveModal(true);
    } else {
      setShowReportBlockModal({
        isOpen: true,
        userId: connection.member.memberId,
        memberId: connection.member.memberId,
        connectionId: connection.connectionId,
        isBlocked: isOrgBlocked,
        isOrganization: true,
        name: companyName,
      });
    }
  };

  const handleTeamMemberMenuAction = (
    action: 'report-block' | 'report-unblock',
    teamMember: TeamMember
  ) => {
    setShowTeamMemberMenu(null);
    const isTeamMemberBlocked = teamMember.blockStatus === 'blocked' || teamMember.isBlocked || false;
    setShowReportBlockModal({
      isOpen: true,
      userId: teamMember.userId || `${teamMember.firstName}_${teamMember.lastName}`, // Use userId if available
      memberId: connection.member.memberId,
      connectionId: connection.connectionId,
      isBlocked: isTeamMemberBlocked,
      isOrganization: false,
      name: `${teamMember.firstName} ${teamMember.lastName}`,
    });
  };

  const handleReportBlockSubmit = (type: 'report' | 'block' | 'unblock', reason?: string) => {
    if (type === 'report' && reason) {
      // For organization: userId is null, for team member: userId is the actual user ID
      const reportedUserId = showReportBlockModal.isOrganization ? null : showReportBlockModal.userId;
      onReport(showReportBlockModal.memberId, reportedUserId, reason);
    } else if (type === 'block') {
      onBlock(showReportBlockModal.userId, showReportBlockModal.connectionId);
    } else if (type === 'unblock') {
      onUnblock(showReportBlockModal.userId, showReportBlockModal.connectionId);
    }
    setShowReportBlockModal({ isOpen: false, userId: '', memberId: '', connectionId: '', isBlocked: false, isOrganization: false, name: '' });
  };

  const handleRemoveConfirm = () => {
    onRemove(connection.connectionId);
    setShowRemoveModal(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Organization Card - Only show when company matches or no search */}
        {searchMatchType !== 'teamMember' && (
          <div className="flex items-center gap-4 rounded-xl bg-wfzo-gold-100 p-0">
            {/* Logo */}
            <div className="flex-shrink-0 w-[60px] h-[60px] rounded-xl border border-wfzo-gold-200 bg-white overflow-hidden flex items-center justify-center p-[15px]">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={companyName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-wfzo-gold-200 rounded-lg flex items-center justify-center text-wfzo-gold-600 font-bold">
                  {companyName.charAt(0)}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1">
                <h3 className="font-source text-base font-bold leading-5 text-wfzo-grey-900">
                  {companyName}
                </h3>
                {teamMembers.length > 0 && !isOrgBlocked && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 mt-1"
                  >
                    <span className="font-source text-sm font-normal leading-5 text-wfzo-gold-600">
                      {isExpanded ? 'Hide Team Members' : `View Team Members (${teamMembers.length})`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-6 h-6 text-wfzo-gold-600" />
                    ) : (
                      <ChevronDown className="w-6 h-6 text-wfzo-gold-600" />
                    )}
                  </button>
                )}
              </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Message Button */}
              <button
                onClick={() => !isOrgBlocked && handleMessage()}
                disabled={isOrgBlocked}
                className={cn(
                  'px-6 py-2 rounded-xl font-source text-base font-semibold leading-6 transition-colors',
                  isOrgBlocked
                    ? 'bg-wfzo-grey-300 text-wfzo-grey-600 cursor-not-allowed'
                    : 'border-2 border-wfzo-gold-600 text-wfzo-gold-600 hover:bg-wfzo-gold-50'
                )}
              >
                {isOrgBlocked ? 'Blocked' : 'Message'}
              </button>

              {/* Three-dot Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowOrgMenu(!showOrgMenu)}
                  className="p-2 rounded-xl bg-wfzo-gold-200 hover:bg-wfzo-gold-300 transition-colors"
                >
                  <MoreVertical className="w-6 h-6 text-wfzo-gold-600" />
                </button>

                {showOrgMenu && (
                  <ConnectionActionsMenu
                    isOrganization={true}
                    isBlocked={isOrgBlocked}
                    onClose={() => setShowOrgMenu(false)}
                    onAction={handleOrgMenuAction}
                    isPrimaryUser={isPrimaryUser}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Team Members */}
        {(isExpanded || searchMatchType === 'teamMember') && teamMembers.length > 0 && (
          <div className="flex flex-col gap-4 pl-5">
            {teamMembers.map((teamMember, index) => {
              console.log('Team Member:', teamMember);
              // Check if either the organization OR the team member is blocked
              const isTeamMemberBlocked = teamMember.blockStatus === 'blocked' || teamMember.isBlocked || false;
              const isBlocked = isOrgBlocked || isTeamMemberBlocked;
              const memberKey = `${teamMember.firstName}_${teamMember.lastName}_${index}`;
              return (
                <div key={memberKey} className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-[60px] h-[60px] rounded-xl border border-wfzo-gold-200 overflow-hidden',
                      isBlocked && 'opacity-70'
                    )}
                  >
                    {teamMember.userLogoUrl ? (
                      <img
                        src={teamMember.userLogoUrl}
                        alt={`${teamMember.firstName} ${teamMember.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-wfzo-gold-200 flex items-center justify-center text-wfzo-gold-600 font-bold">
                        {teamMember?.firstName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1">
                      <h4
                        className={cn(
                          'font-source text-base font-bold leading-5',
                          isBlocked ? 'text-wfzo-grey-500' : 'text-wfzo-grey-900'
                        )}
                      >
                        {teamMember?.firstName} {teamMember?.lastName}
                      </h4>
                      {teamMember.designation && (
                        <p
                          className={cn(
                            'font-source text-sm font-normal leading-5 mt-1',
                            isBlocked ? 'text-wfzo-grey-500' : 'text-wfzo-grey-700'
                          )}
                        >
                          {teamMember?.designation}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {/* Message Button */}
                      <button
                        onClick={() => !isBlocked && handleMessage(teamMember)}
                        disabled={isBlocked}
                        className={cn(
                          'px-6 py-2 rounded-xl font-source text-base font-semibold leading-6 transition-colors',
                          isBlocked
                            ? 'bg-wfzo-grey-300 text-wfzo-grey-600 cursor-not-allowed'
                            : 'border-2 border-wfzo-gold-600 text-wfzo-gold-600 hover:bg-wfzo-gold-50'
                        )}
                      >
                        {isBlocked ? 'Blocked' : 'Message'}
                      </button>

                      {/* Three-dot Menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowTeamMemberMenu(
                              showTeamMemberMenu === memberKey ? null : memberKey
                            )
                          }
                          className="p-2 rounded-xl bg-wfzo-gold-50 hover:bg-wfzo-gold-100 transition-colors"
                        >
                          <MoreVertical className="w-6 h-6 text-wfzo-gold-600" />
                        </button>

                        {showTeamMemberMenu === memberKey && (
                          <ConnectionActionsMenu
                            isOrganization={false}
                            isBlocked={isBlocked}
                            onClose={() => setShowTeamMemberMenu(null)}
                            onAction={(action) =>
                              handleTeamMemberMenuAction(action as 'report-block' | 'report-unblock', teamMember)
                            }
                            isPrimaryUser={isPrimaryUser}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-wfzo-gold-200" />
      </div>

      {/* Modals */}
      <ReportBlockModal
        isOpen={showReportBlockModal.isOpen}
        isBlocked={showReportBlockModal.isBlocked}
        isOrganization={showReportBlockModal.isOrganization}
        name={showReportBlockModal.name}
        onClose={() =>
          setShowReportBlockModal({ isOpen: false, userId: '', memberId: '', connectionId: '', isBlocked: false, isOrganization: false, name: '' })
        }
        onSubmit={handleReportBlockSubmit}
      />

      <RemoveConnectionModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveConfirm}
        organizationName={companyName}
      />
    </>
  );
};

export default ConnectionCard;
