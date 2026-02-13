"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MessageCircle, Star, Ban } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { chatService, type Conversation, type User } from '@/services/chatService';
import { useAuth } from '@/lib/auth/useAuth';

interface ConversationListProps {
  selectedMemberId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  className?: string;
  refreshTrigger?: number; // Add optional refresh trigger
  showStarredOnly?: boolean; // Add optional starred filter
  selectedConversation?: Conversation; // Add selected conversation to update it
}

const ConversationList: React.FC<ConversationListProps> = ({
  selectedMemberId,
  onSelectConversation,
  onNewChat,
  className,
  refreshTrigger,
  showStarredOnly = false,
  selectedConversation,
}) => {
  const { member: authMember, user: authUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Get logged-in user's ID from userSnapshots
  const loggedInUserId = React.useMemo(() => {
    if (!authMember || !authUser?.email) return null;
    
    const userSnapshots = (authMember as any).userSnapshots || [];
    const user = userSnapshots.find((u: any) => u.email === authUser.email);
    
    return user?.id || null;
  }, [authMember, authUser]);

  const loadConversations = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await chatService.getConversations(pageNum, 10);
      
      // Deduplicate conversations for internal chats
      const deduplicatedConversations = response.data.reduce((acc: Conversation[], conv) => {
        const chatType = conv.chatType || 'member';
        const isInternalChat = chatType === 'user' && 
          authMember && 
          conv.member.memberId === (authMember as any).memberId;
        
        if (isInternalChat && conv.user && conv.lastMessage && loggedInUserId) {
          // For internal chats, identify both participants in this conversation
          const participant1 = conv.lastMessage.senderUserId;
          const participant2 = conv.lastMessage.recipientUserId;
          
          // Skip if we can't determine participants
          if (!participant1 || !participant2) {
            acc.push(conv);
            return acc;
          }
          
          // Find the other user (not the logged-in user)
          const otherUserId = participant1 === loggedInUserId ? participant2 : participant1;
          
          // Check if we already have a conversation with this user
          const existingIndex = acc.findIndex(existing => {
            const existingChatType = existing.chatType || 'member';
            const existingIsInternal = existingChatType === 'user' && 
              authMember && 
              existing.member.memberId === (authMember as any).memberId;
            
            if (!existingIsInternal || !existing.lastMessage) return false;
            
            const existingP1 = existing.lastMessage.senderUserId;
            const existingP2 = existing.lastMessage.recipientUserId;
            
            if (!existingP1 || !existingP2) return false;
            
            // Check if both conversations involve the same two people
            const existingOtherUserId = existingP1 === loggedInUserId ? existingP2 : existingP1;
            
            return existingOtherUserId === otherUserId;
          });
          
          if (existingIndex >= 0) {
            // Keep the conversation with the most recent message
            const existingDate = new Date(acc[existingIndex].lastMessage.createdAt);
            const currentDate = new Date(conv.lastMessage.createdAt);
            
            if (currentDate > existingDate) {
              acc[existingIndex] = conv;
            }
          } else {
            acc.push(conv);
          }
        } else {
          // For external chats, keep all conversations
          acc.push(conv);
        }
        
        return acc;
      }, []);
      
      if (pageNum === 1) {
        setConversations(deduplicatedConversations);
      } else {
        setConversations((prev) => [...prev, ...deduplicatedConversations]);
      }
      
      setHasMore(response.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [authMember, loggedInUserId]);

  // Load conversations when component mounts or when auth data is ready
  useEffect(() => {
    if (authMember && loggedInUserId) {
      loadConversations(1);
    }
  }, [loadConversations, authMember, loggedInUserId]);

  // Reload conversations when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && authMember && loggedInUserId) {
      loadConversations(1);
    }
  }, [refreshTrigger, loadConversations, authMember, loggedInUserId]);

  // Update selected conversation when conversations list changes
  useEffect(() => {
    if (selectedConversation && conversations.length > 0) {
      // Find the matching conversation in the updated list
      const chatType = selectedConversation.chatType || 'member';
      const selectedUserId = selectedConversation.user?.userId;
      
      const updatedConversation = conversations.find(conv => {
        const convChatType = conv.chatType || 'member';
        const convUserId = conv.user?.userId;
        
        // Match by memberId and userId (if user-level chat)
        return conv.member.memberId === selectedConversation.member.memberId &&
               convChatType === chatType &&
               (!selectedUserId || convUserId === selectedUserId);
      });
      
      if (updatedConversation) {
        // Only update if blockStatus has changed
        const currentBlockStatus = selectedConversation.blockStatus;
        const newBlockStatus = updatedConversation.blockStatus;
        
        const hasBlockStatusChanged = 
          currentBlockStatus?.isBlocked !== newBlockStatus?.isBlocked ||
          currentBlockStatus?.iBlockedThem !== newBlockStatus?.iBlockedThem ||
          currentBlockStatus?.theyBlockedMe !== newBlockStatus?.theyBlockedMe;
        
        const hasStarredChanged = selectedConversation.isStarred !== updatedConversation.isStarred;
        
        if (hasBlockStatusChanged || hasStarredChanged) {
          // Update the selected conversation with fresh data
          onSelectConversation(updatedConversation);
        }
      }
    }
  }, [conversations]);

  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;

    // Apply starred filter first
    if (showStarredOnly) {
      filtered = filtered.filter(conv => conv.isStarred === true);
    }

    // Then apply search filter
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter((conv) => {
      const chatType = conv.chatType || 'member';
      
      // Build searchable text based on chat type
      let searchableText = '';
      
      if (chatType === 'user' && conv.user) {
        // Check if this is an internal chat (same organization)
        const isInternalChat = authMember && conv.member.memberId === (authMember as any).memberId;
        let displayUser = conv.user;
        
        // For internal chats, find the other user
        if (isInternalChat && conv.lastMessage && loggedInUserId) {
          if (conv.user.userId === loggedInUserId) {
            // Find the other user from lastMessage
            const otherUserId = conv.lastMessage.senderUserId === loggedInUserId
              ? conv.lastMessage.recipientUserId
              : conv.lastMessage.senderUserId;
            
            if (otherUserId) {
              // Get all users from authMember's userSnapshots
              const userSnapshots = (authMember as any).userSnapshots || [];
              const otherUser = userSnapshots.find((u: any) => u.id === otherUserId);
              
              if (otherUser) {
                displayUser = {
                  userId: otherUser.id,
                  firstName: otherUser.firstName,
                  lastName: otherUser.lastName,
                  email: otherUser.email,
                  designation: otherUser.designation || '',
                  userType: otherUser.userType,
                  profileImageUrl: otherUser.profileImageUrl
                };
              }
            }
          }
        }
        
        // For user chats: search by user name, email, company name
        const userName = `${displayUser.firstName} ${displayUser.lastName}`.toLowerCase();
        const userEmail = (displayUser.email || '').toLowerCase();
        const companyName = (conv.member.companyName || '').toLowerCase();
        searchableText = `${userName} ${userEmail} ${companyName}`;
      } else {
        // For member chats: search by company name
        searchableText = (conv.member.companyName || '').toLowerCase();
      }
      
      // Also search in message content
      const messageContent = (conv.lastMessage.content || '').toLowerCase();
      searchableText += ` ${messageContent}`;
      
      return searchableText.includes(query);
    });
  }, [conversations, searchQuery, authMember, loggedInUserId, showStarredOnly]);

  // Sort conversations: starred at top, then by timestamp
  const sortedConversations = React.useMemo(() => {
    return [...filteredConversations].sort((a, b) => {
      // First, sort by starred status (starred first)
      const aStarred = a.isStarred || false;
      const bStarred = b.isStarred || false;
      
      if (aStarred && !bStarred) return -1; // a is starred, b is not -> a comes first
      if (!aStarred && bStarred) return 1;  // b is starred, a is not -> b comes first
      
      // If both are starred or both are not starred, sort by timestamp (newest first)
      const aTime = new Date(a.lastMessage.createdAt).getTime();
      const bTime = new Date(b.lastMessage.createdAt).getTime();
      return bTime - aTime; // Descending order (newest first)
    });
  }, [filteredConversations]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    if (isNearBottom && hasMore && !isLoading) {
      loadConversations(page + 1);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
      return 'Just now';
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <section className='flex flex-col h-full bg-white rounded-[20px] overflow-hidden border border-[#E7DAC8]'>
      {/* Header with Search and New Chat Button */}
      <div className="p-6 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat text-xl font-bold text-zinc-900">Messages</h2>
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 px-4 py-2 bg-wfzo-gold-600 text-white rounded-lg hover:bg-wfzo-gold-700 transition-colors font-source text-sm font-semibold shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a User"
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg font-source text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-wfzo-gold-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto pt-4" onScroll={handleScroll}>
        {isLoading && page === 1 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wfzo-gold-600"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="font-source text-sm text-red-600 mb-2">{error}</p>
            <button
              onClick={() => loadConversations(1)}
              className="text-wfzo-gold-600 font-source text-sm font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle className="w-12 h-12 text-zinc-300 mb-3" />
            <p className="font-source text-sm text-zinc-500 mb-1">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="font-source text-xs text-zinc-400">
              {searchQuery ? 'Try a different search' : 'Start a conversation with your connections'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {sortedConversations.map((conversation) => {
              const member = conversation.member;
              const chatType = conversation.chatType || 'member';
              
              // Check if this is an internal chat (same organization)
              const isInternalChat = chatType === 'user' && authMember && member.memberId === (authMember as any).memberId;
              
              // Determine the correct user to display
              let displayUser = conversation.user;
              
              if (isInternalChat && conversation.lastMessage && loggedInUserId && displayUser) {
                // If backend returned the logged-in user, find the other participant
                if (displayUser.userId === loggedInUserId) {
                  const otherUserId = conversation.lastMessage.senderUserId === loggedInUserId
                    ? conversation.lastMessage.recipientUserId
                    : conversation.lastMessage.senderUserId;
                  
                  if (otherUserId) {
                    // Get all users from authMember's userSnapshots
                    const userSnapshots = (authMember as any).userSnapshots || [];
                    const otherUser = userSnapshots.find((u: any) => u.id === otherUserId);
                    
                    if (otherUser) {
                      displayUser = {
                        userId: otherUser.id,
                        firstName: otherUser.firstName,
                        lastName: otherUser.lastName,
                        email: otherUser.email,
                        designation: otherUser.designation || '',
                        userType: otherUser.userType,
                        profileImageUrl: otherUser.profileImageUrl
                      };
                    }
                  }
                }
              }
              
              // Determine display name based on chat type
              let displayName: string;
              let subtitle: string | undefined;
              
              if (chatType === 'user' && displayUser) {
                // Check if this is a true user-to-user chat or member-level chat
                // Primary users represent the organization, so show company name for them
                const isPrimaryUser = displayUser.userType === 'Primary';
                
                if (isPrimaryUser) {
                  // Primary user represents the organization - show company name
                  displayName = member.companyName || 'Company Name';
                  subtitle = undefined;
                } else {
                  // True user-to-user chat with secondary user - show individual name
                  displayName = `${displayUser.firstName} ${displayUser.lastName}`;
                  subtitle = member.companyName || '';
                }
              } else {
                // Member-level chat - always show company name
                displayName = member.companyName || 'Company Name';
                subtitle = undefined;
              }
              
              // Determine if this is a true user-to-user chat (not primary user/member-level)
              const isTrueUserChat = chatType === 'user' && displayUser && displayUser.userType !== 'Primary';
              
              const logoUrl = isTrueUserChat && displayUser?.profileImageUrl 
                ? displayUser.profileImageUrl 
                : member.logo;
              const location = member.address
                ? [member.address.city, member.address.country].filter(Boolean).join(', ')
                : '';

              const isSelected = selectedMemberId === member.memberId;
              const hasUnread = conversation.unreadCount > 0;
              const isStarred = conversation.isStarred || false;
              const blockStatus = conversation.blockStatus;
              // Only grey out if I blocked them (not if they blocked me)
              const iBlockedThem = blockStatus?.iBlockedThem || false;
              console.log('Rendering conversation with block status:', conversation);
              // Create a corrected conversation object for internal chats
              const correctedConversation: Conversation = {
                ...conversation,
                user: displayUser
              };

              return (
                <button
                  key={`${member.memberId}-${displayUser?.userId || 'org'}-${conversation.lastMessage.createdAt}`}
                  onClick={() => onSelectConversation(correctedConversation)}
                  className={cn(
                    'w-full flex items-start gap-3 p-4 hover:bg-zinc-50 transition-colors text-left relative',
                    isSelected && 'bg-wfzo-gold-50'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      "w-12 h-12 rounded-full bg-wfzo-gold-200 flex items-center justify-center overflow-hidden",
                      iBlockedThem && "opacity-40 grayscale"
                    )}>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-wfzo-gold-600 font-semibold text-lg">
                          {displayName.charAt(0)}
                        </span>
                      )}
                    </div>
                    {/* Badge for chat type - only show for true user-to-user chats */}
                    {isTrueUserChat && !iBlockedThem && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-[8px]">👤</span>
                      </div>
                    )}
                    {/* Block icon for blocked conversations */}
                    {iBlockedThem && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full border-2 border-white flex items-center justify-center">
                        <Ban className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn(
                    "flex-1 min-w-0",
                    iBlockedThem && "opacity-50"
                  )}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              'font-source text-sm truncate',
                              hasUnread && !iBlockedThem ? 'font-bold text-zinc-900' : 'font-semibold',
                              iBlockedThem ? 'text-zinc-400' : 'text-zinc-700'
                            )}
                          >
                            {displayName}
                          </h3>
                          {/* Starred indicator - only show in starred view */}
                          {isStarred && !iBlockedThem && (
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                          )}
                        </div>
                        {subtitle && (
                          <p className={cn(
                            "font-source text-xs truncate",
                            iBlockedThem ? "text-zinc-400" : "text-zinc-500"
                          )}>
                            {subtitle}
                          </p>
                        )}
                      </div>
                      <span className={cn(
                        "font-source text-xs ml-2 flex-shrink-0",
                        iBlockedThem ? "text-zinc-300" : "text-zinc-400"
                      )}>
                        {formatTimestamp(conversation.lastMessage.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          'font-source text-xs flex-1 truncate',
                          hasUnread && !iBlockedThem ? 'text-zinc-700 font-medium' : iBlockedThem ? 'text-zinc-400' : 'text-zinc-500'
                        )}
                      >
                        {conversation.lastMessage.content}
                      </p>

                      {/* Unread Badge - don't show for blocked conversations */}
                      {hasUnread && !iBlockedThem && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Loading more indicator */}
            {isLoading && page > 1 && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-wfzo-gold-600"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ConversationList;
