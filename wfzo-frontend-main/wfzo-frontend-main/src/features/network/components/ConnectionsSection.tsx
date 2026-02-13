'use client';

import { useState, useMemo } from 'react';
import { Search, MoreVertical, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Connection, TeamMember } from '../types';

interface ConnectionsSectionProps {
  connections: Connection[];
  currentUserId: string;
  currentUserType: 'Primary' | 'Secondary';
}

export default function ConnectionsSection({
  connections: initialConnections,
  currentUserId,
  currentUserType,
}: ConnectionsSectionProps) {
  const [connections] = useState(initialConnections);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const query = searchQuery.toLowerCase();
    return connections.filter(conn => {
      const orgName = conn.member?.organisationInfo?.companyName?.toLowerCase() || '';
      const teamMembers = conn.member?.secondaryUsers || [];
      const memberMatch = teamMembers.some(member => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        return fullName.includes(query);
      });
      return orgName.includes(query) || memberMatch;
    });
  }, [connections, searchQuery]);

  const toggleExpanded = (connectionId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(connectionId)) {
        newSet.delete(connectionId);
      } else {
        newSet.add(connectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        {/* Main Content */}
        <div className="flex-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>🏠</span>
            <span>/</span>
            <span>Membership</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Your Connections</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Connections</h1>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`${connections.length} Connections`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Connections List */}
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {filteredConnections.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                No connections found
              </div>
            ) : (
              filteredConnections.map((connection) => {
                if (!connection.member) return null;
                
                const { organisationInfo } = connection.member;
                const teamMembers = connection.member?.secondaryUsers || [];
                const orgName = organisationInfo?.companyName || 'Unknown Organization';
                const orgLogo = organisationInfo?.memberLogoUrl;
                const isExpanded = expandedCards.has(connection.connectionId);
                const hasTeamMembers = teamMembers.length > 0;

                return (
                  <div key={connection.connectionId} className="p-6">
                    {/* Organization Header */}
                    <div className="flex items-start gap-4">
                      {/* Org Logo */}
                      <div className="flex-shrink-0">
                        {orgLogo ? (
                          <img 
                            src={orgLogo} 
                            alt={orgName}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 font-bold text-2xl">
                              {orgName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Org Info & Members */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">{orgName}</h3>

                        {/* Team Members */}
                        <div className="space-y-3">
                          {teamMembers.slice(0, isExpanded ? teamMembers.length : 1).map((member: TeamMember) => {
                            const memberName = `${member.firstName} ${member.lastName}`;
                            const memberAvatar = member.userLogoUrl || member.profileImageUrl;
                            const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`;
                            
                            return (
                              <div key={member.userId} className="flex items-center gap-3">
                                {/* Avatar */}
                                {memberAvatar ? (
                                  <img 
                                    src={memberAvatar}
                                    alt={memberName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-700 font-semibold text-sm">
                                      {initials}
                                    </span>
                                  </div>
                                )}
                                
                                {/* User Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">
                                    {memberName}
                                  </p>
                                  {member.designation && (
                                    <p className="text-sm text-gray-600">{member.designation}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* View/Hide Team Members Button */}
                        {hasTeamMembers && teamMembers.length > 1 && (
                          <button
                            onClick={() => toggleExpanded(connection.connectionId)}
                            className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={16} />
                                Hide Team Members
                              </>
                            ) : (
                              <>
                                <ChevronDown size={16} />
                                View Team Members ({teamMembers.length - 1})
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-start gap-2 flex-shrink-0">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Message
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowMenu(showMenu === connection.connectionId ? null : connection.connectionId)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical size={20} className="text-gray-600" />
                          </button>
                          
                          {showMenu === connection.connectionId && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <span>👤</span>
                                Remove Connection
                              </button>
                              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <span>🚫</span>
                                Report / Block user
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6 sticky top-6">
            <h3 className="font-bold text-lg text-gray-900 mb-2">Be a Featured Member</h3>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae purus est amet leo lectus lorem in lorem.
            </p>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors">
              Get featured
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
}
