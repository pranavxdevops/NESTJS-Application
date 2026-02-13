"use client";

import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { inboxService } from '../services/inboxService';
import { useAuth } from '@/lib/auth/useAuth';
import type { Connection, User as UserType } from '../types';

interface ConnectionListProps {
  selectedConnectionId?: string;
  onSelectConnection: (connection: Connection, user?: UserType) => void;
  onBack: () => void;
  className?: string;
}

const ConnectionList: React.FC<ConnectionListProps> = ({
  selectedConnectionId,
  onSelectConnection,
  onBack,
  className,
}) => {
  const { member } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Get the logged-in user's ID from primary users
  const loggedInUserId = React.useMemo(() => {
    return member?.primaryUsers?.[0]?.userId || null;
  }, [member]);

  // Get the logged-in member's memberId to identify same organization
  const loggedInMemberId = React.useMemo(() => {
    return member?.memberId || null;
  }, [member]);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const response = await inboxService.getMyConnections(1, 100);
      if (response.success) {
        setConnections(response.data);
      }
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Create a flat list of searchable items (members + secondary users)
  const searchableItems = React.useMemo(() => {
    const items: Array<{
      type: 'member' | 'user';
      connection: Connection;
      user?: UserType;
      displayName: string;
      subtitle: string;
      logoUrl?: string;
      searchText: string; // Combined search text
    }> = [];

    connections.forEach((conn) => {
      const companyName = conn.member?.organisationInfo?.companyName || 'Company Name';
      const logoUrl = conn.member?.organisationInfo?.memberLogoUrl;
      const location = conn.member?.organisationInfo?.address
        ? [
            conn.member?.organisationInfo?.address.city,
            conn.member?.organisationInfo?.address.state,
            conn.member?.organisationInfo?.address.country,
          ]
            .filter(Boolean)
            .join(', ')
        : '';

      // Check if this is the same organization as the logged-in user
      const isSameOrganization = loggedInMemberId && conn.member.memberId === loggedInMemberId;

      // Only show cross-organization chat options (skip same organization entirely)
      if (isSameOrganization) {
        return; // Skip entire connection if it's the same organization
      }

      // Add the member/organization (only from other organizations)
      items.push({
        type: 'member',
        connection: conn,
        displayName: companyName,
        subtitle: location,
        logoUrl,
        searchText: `${companyName} ${location}`.toLowerCase(),
      });

      // Add secondary users (filtered to exclude logged-in user, only from other organizations)
      const secondaryUsers = (conn.member.secondaryUsers || []).filter(
        user => !loggedInUserId || user.userId !== loggedInUserId
      );
      secondaryUsers.forEach((user) => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const subtitle = `${user.designation}${companyName ? ` • ${companyName}` : ''}`;
        
        items.push({
          type: 'user',
          connection: conn,
          user,
          displayName: fullName,
          subtitle: subtitle,
          logoUrl: user.profileImageUrl || logoUrl,
          searchText: `${fullName} ${user.email || ''} ${user.designation || ''} ${companyName}`.toLowerCase(),
        });
      });
    });

    // Debug: Log all searchable items
    console.log('Total connections:', connections.length);
    console.log('Total searchable items created:', items.length);
    const userItems = items.filter(i => i.type === 'user');
    console.log('User items:', userItems.length);
    if (userItems.length > 0) {
      console.log('Sample users:', userItems.slice(0, 3).map(u => ({
        name: u.displayName,
        searchText: u.searchText
      })));
    }

    return items;
  }, [connections, loggedInUserId, loggedInMemberId]);

  const filteredItems = React.useMemo(() => {
    if (!searchQuery.trim()) return null; // Return null when no search query

    const query = searchQuery.toLowerCase().trim();
    const results = searchableItems.filter((item) => {
      return item.searchText.includes(query);
    });
    
    // Debug: Log search results
    console.log('Search Query:', query);
    console.log('Total searchable items:', searchableItems.length);
    console.log('Filtered results:', results.length);
    if (results.length > 0) {
      console.log('Sample results:', results.slice(0, 3).map(r => ({
        type: r.type,
        name: r.displayName,
        searchText: r.searchText
      })));
    }
    
    return results;
  }, [searchableItems, searchQuery]);

  const filteredConnections = React.useMemo(() => {
    if (!searchQuery.trim()) return connections;
    return connections; // Not used when searching
  }, [connections, searchQuery]);

  // Create grouped items for alphabetical display (members + users)
  const groupedItems = React.useMemo(() => {
    // Create a flat list of all items
    const allItems: Array<{
      type: 'member' | 'user';
      connection: Connection;
      user?: UserType;
      displayName: string;
      subtitle: string;
      logoUrl?: string;
      sortKey: string;
    }> = [];

    connections.forEach((conn) => {
      const companyName = conn.member?.organisationInfo?.companyName || 'Company Name';
      const logoUrl = conn.member?.organisationInfo?.memberLogoUrl;
      const location = conn.member?.organisationInfo?.address
        ? [
            conn.member?.organisationInfo?.address.city,
            conn.member?.organisationInfo?.address.state,
          ]
            .filter(Boolean)
            .join(', ')
        : '';

      // Check if this is the same organization as the logged-in user
      const isSameOrganization = loggedInMemberId && conn.member.memberId === loggedInMemberId;

      // Only show cross-organization chat options (skip same organization entirely)
      if (isSameOrganization) {
        return; // Skip entire connection if it's the same organization
      }

      // Add the member/organization (only from other organizations)
      allItems.push({
        type: 'member',
        connection: conn,
        displayName: companyName,
        subtitle: location,
        logoUrl,
        sortKey: companyName.toLowerCase(),
      });

      // Add secondary users (filtered to exclude logged-in user, only from other organizations)
      const secondaryUsers = (conn.member.secondaryUsers || []).filter(
        user => !loggedInUserId || user.userId !== loggedInUserId
      );
      
      secondaryUsers.forEach((user) => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const subtitle = `${user.designation}${companyName ? ` • ${companyName}` : ''}`;
        
        allItems.push({
          type: 'user',
          connection: conn,
          user,
          displayName: fullName,
          subtitle: subtitle,
          logoUrl: user.profileImageUrl || logoUrl,
          sortKey: fullName.toLowerCase(),
        });
      });
    });

    // Sort all items alphabetically
    allItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Group by first letter
    const grouped: Record<string, typeof allItems> = {};
    allItems.forEach((item) => {
      const firstLetter = item.displayName.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(item);
    });

    return grouped;
  }, [connections, loggedInUserId, loggedInMemberId]);

  const alphabeticalKeys = Object.keys(groupedItems).sort();

  return (
    <div className='flex flex-col h-full bg-white rounded-[20px] overflow-hidden border border-[#E7DAC8]'>
      {/* Header with Back Button */}
      <div className="p-4 border-b border-zinc-200">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-montserrat text-lg font-bold text-zinc-900">New Chat</h2>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search for a member"
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg font-source text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-wfzo-gold-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Connections List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wfzo-gold-600"></div>
          </div>
        ) : searchQuery.trim() ? (
          // Search Results - Flat list
          filteredItems && filteredItems.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {filteredItems.map((item, index) => {
                const isSelected = selectedConnectionId === item.connection.member.memberId;
                
                return (
                  <button
                    key={`${item.connection.connectionId}-${item.user?.userId || 'member'}-${index}`}
                    onClick={() => onSelectConnection(item.connection, item.user)}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors text-left',
                      isSelected && 'bg-wfzo-gold-50'
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-wfzo-gold-200 flex items-center justify-center overflow-hidden">
                        {item.logoUrl ? (
                          <img
                            src={item.logoUrl}
                            alt={item.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-wfzo-gold-600 font-semibold text-lg">
                            {item.displayName.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-source text-sm font-semibold text-zinc-900 mb-0.5 truncate">
                        {item.displayName}
                      </h3>
                      {item.subtitle && (
                        <p className="font-source text-xs text-zinc-500 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="font-source text-sm text-zinc-500">No results found</p>
            </div>
          )
        ) : filteredConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="font-source text-sm text-zinc-500">No connections yet</p>
          </div>
        ) : (
          // Default view - Alphabetical with members and secondary users
          <div>
            {alphabeticalKeys.map((letter) => (
              <div key={letter}>
                {/* Alphabet Header */}
                <div className="sticky top-0 bg-zinc-100 px-4 py-2 border-b border-zinc-200">
                  <h4 className="font-source text-sm font-bold text-zinc-700">
                    {letter}
                  </h4>
                </div>

                {/* Members under this alphabet */}
                <div className="divide-y divide-zinc-100">
                  {groupedItems[letter].map((item, index) => {
                    const isSelected = selectedConnectionId === item.connection.member.memberId;
                    
                    return (
                      <button
                        key={`${item.connection.connectionId}-${item.user?.userId || 'member'}-${index}`}
                        onClick={() => onSelectConnection(item.connection, item.user)}
                        className={cn(
                          'w-full flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors text-left',
                          isSelected && 'bg-wfzo-gold-50'
                        )}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-wfzo-gold-200 flex items-center justify-center overflow-hidden">
                            {item.logoUrl ? (
                              <img
                                src={item.logoUrl}
                                alt={item.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-wfzo-gold-600 font-semibold text-lg">
                                {item.displayName.charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-source text-sm font-semibold text-zinc-900 mb-0.5 truncate">
                            {item.displayName}
                          </h3>
                          {item.subtitle && (
                            <p className="font-source text-xs text-zinc-500 truncate">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionList;
