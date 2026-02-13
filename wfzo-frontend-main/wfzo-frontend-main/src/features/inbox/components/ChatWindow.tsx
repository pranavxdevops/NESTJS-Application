"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Download, FileText, CheckCheck, MoreVertical, Star, Ban, Trash2 } from 'lucide-react';
import GoldButton from '@/shared/components/GoldButton';
import { chatService, type Message, type Conversation } from '@/services/chatService';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/auth/useAuth';
import { MessageAttachment } from './MessageAttachment';

interface ChatWindowProps {
  selectedConversation?: Conversation;
  className?: string;
  onMessageSent?: () => void; // Add callback for when a message is sent
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  selectedConversation,
  className,
  onMessageSent
}) => {
  const { member: authMember, user: authUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    type: 'image' | 'document';
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    preview?: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const [currentUserMemberId, setCurrentUserMemberId] = useState<string | null>(null);
  const [isStarred, setIsStarred] = useState(false);
  const [blockStatus, setBlockStatus] = useState<{
    isBlocked: boolean;
    iBlockedThem: boolean;
    theyBlockedMe: boolean;
  } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Get logged-in user's ID from userSnapshots
  const loggedInUserId = React.useMemo(() => {
    if (!authMember || !authUser?.email) return null;
    
    const userSnapshots = (authMember as any).userSnapshots || [];
    const user = userSnapshots.find((u: any) => u.email === authUser.email);
    
    return user?.id || null;
  }, [authMember, authUser]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Track if we're loading older messages vs new messages
  const isLoadingOlderRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  // Scroll management: scroll to bottom on initial load and new messages
  useEffect(() => {
    if (messages.length === 0) return;

    // Initial load - scroll to bottom immediately
    if (prevMessagesLengthRef.current === 0 && messages.length > 0) {
      setTimeout(() => scrollToBottom('auto'), 50);
    }
    // New message added at the end - scroll to bottom
    else if (!isLoadingOlderRef.current && messages.length > prevMessagesLengthRef.current) {
      scrollToBottom('smooth');
    }
    // Older messages loaded - maintain scroll position
    else if (isLoadingOlderRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const newScrollHeight = container.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeightRef.current;
      container.scrollTop = scrollDiff;
      isLoadingOlderRef.current = false;
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Load more messages when scrolling to top
  useEffect(() => {
    // Use a small delay to ensure the trigger element has been rendered
    const setupObserver = () => {
      const trigger = loadMoreTriggerRef.current;
      const container = messagesContainerRef.current;
      
      if (!trigger || !container || !hasMoreMessages) {
        console.log('Observer setup skipped:', { 
          hasTrigger: !!trigger, 
          hasContainer: !!container, 
          hasMoreMessages 
        });
        return null;
      }

      console.log('Setting up Intersection Observer. Current page:', currentPage, 'Has more:', hasMoreMessages);

      const handleLoadMore = (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0];
        console.log('Intersection detected:', { 
          isIntersecting: entry.isIntersecting, 
          isLoadingMore, 
          hasMoreMessages,
          currentPage 
        });

        if (entry.isIntersecting && hasMoreMessages && !isLoadingMore && selectedConversation) {
          console.log('Loading more messages, page:', currentPage + 1);
          isLoadingOlderRef.current = true;
          
          // Store current scroll height
          if (container) {
            previousScrollHeightRef.current = container.scrollHeight;
          }

          setIsLoadingMore(true);
          
          const loadData = async () => {
            try {
              const chatType = selectedConversation.chatType || 'member';
              const otherUserId = chatType === 'user' && selectedConversation.user 
                ? selectedConversation.user.userId 
                : undefined;
              
              const nextPage = currentPage + 1;
              const response = await chatService.getMessages(
                selectedConversation.member.memberId,
                otherUserId,
                nextPage,
                10
              );
              
              console.log('Loaded messages:', response.data.length, 'Has more:', response.pagination.hasMore);
              
              // Prepend older messages with deduplication
              setMessages(prev => {
                // Create a Set of existing message IDs for fast lookup
                const existingIds = new Set(prev.map(m => m._id));
                
                // Filter out any messages that already exist
                const newMessages = response.data.filter(m => !existingIds.has(m._id));
                
                console.log('New unique messages to add:', newMessages.length, 'out of', response.data.length);
                
                return [...newMessages, ...prev];
              });
              setCurrentPage(nextPage);
              setHasMoreMessages(response.pagination.hasMore);
            } catch (err) {
              console.error('Failed to load more messages:', err);
              isLoadingOlderRef.current = false;
            } finally {
              setIsLoadingMore(false);
            }
          };
          
          loadData();
        }
      };

      const observer = new IntersectionObserver(handleLoadMore, {
        root: container,
        rootMargin: '200px',
        threshold: 0.1,
      });

      observer.observe(trigger);
      console.log('Observer attached to trigger');

      return observer;
    };

    // Add a slight delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      const observer = setupObserver();
      
      // Store observer for cleanup
      if (observer) {
        return () => {
          console.log('Observer disconnecting');
          observer.disconnect();
        };
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasMoreMessages, isLoadingMore, currentPage, selectedConversation, messages.length]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      setIsStarred(false);
      setBlockStatus(null);
      setCurrentPage(1);
      setHasMoreMessages(false);
      prevMessagesLengthRef.current = 0;
      return;
    }

    // Set starred and block status from conversation
    setIsStarred(selectedConversation.isStarred || false);
    setBlockStatus(selectedConversation.blockStatus || null);

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        setCurrentPage(1);
        const chatType = selectedConversation.chatType || 'member';
        const otherUserId = chatType === 'user' && selectedConversation.user 
          ? selectedConversation.user.userId 
          : undefined;
        
        // Load latest 10 messages
        const response = await chatService.getMessages(
          selectedConversation.member.memberId,
          otherUserId,
          1,
          10
        );
        setMessages(response.data);
        setHasMoreMessages(response.pagination.hasMore);
        
        // Update blockStatus from messages response (authoritative source)
        if (response.blockStatus) {
          setBlockStatus(response.blockStatus);
        }
        
        // Determine current user's memberId from messages
        if (response.data.length > 0) {
          const firstMessage = response.data[0];
          const isRecipient = firstMessage.recipientId === selectedConversation.member.memberId;
          setCurrentUserMemberId(isRecipient ? firstMessage.senderId : firstMessage.recipientId);
        }

        // Mark messages as read
        await chatService.markAsRead(selectedConversation.member.memberId, otherUserId);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !uploadedFile) || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      const chatType = selectedConversation.chatType || 'member';
      let recipientUserId: string | undefined;
      
      // Determine recipientUserId based on chat type and scenario
      if (chatType === 'user' && selectedConversation.user) {
        // User-to-user chat: use the selected user's userId
        recipientUserId = selectedConversation.user.userId;
      } else if (chatType === 'member' && authMember) {
        // Check if this is a first-time chat with own organization's primary user
        const isSameOrganization = selectedConversation.member.memberId === (authMember as any).memberId;
        const isFirstMessage = messages.length === 0;
        
        if (isSameOrganization && isFirstMessage) {
          // First-time message to own organization's Member (primary user)
          // Get the primary user's userId from authMember's userSnapshots
          const userSnapshots = (authMember as any).userSnapshots || [];
          const primaryUser = userSnapshots.find((u: any) => u.userType === 'Primary');
          
          if (primaryUser) {
            recipientUserId = primaryUser.id;
          }
        }
        // For all other member chats, recipientUserId remains undefined
      }
      
      // Prepare file data without the preview property
      let fileData: {
        type: 'image' | 'document';
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
      } | undefined;
      
      if (uploadedFile) {
        fileData = {
          type: uploadedFile.type,
          fileUrl: uploadedFile.fileUrl,
          fileName: uploadedFile.fileName,
          fileSize: uploadedFile.fileSize,
          mimeType: uploadedFile.mimeType,
        };
      }
      
      const response = await chatService.sendMessage(
        selectedConversation.member.memberId,
        newMessage.trim() || (uploadedFile ? uploadedFile.fileName : ''),
        recipientUserId,
        fileData
      );
      
      // Add new message to the list
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');
      setUploadedFile(null);
      
      // Notify parent that a message was sent
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);
        const response = await chatService.uploadFile(file);
        
        // Create preview for images
        let preview: string | undefined;
        const type = response.data.type;
        if (type === 'image') {
          preview = URL.createObjectURL(file);
        }

        setUploadedFile({
          ...response.data,
          preview,
        });
      } catch (err) {
        console.error('Failed to upload file:', err);
        alert('Failed to upload file. Please try again.');
      } finally {
        setIsUploading(false);
      }
    };

    input.click();
  };

  const handleRemoveFile = () => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  };

  const handleStarChat = async () => {
    if (!selectedConversation) return;
    
    try {
      setShowMenu(false);
      const chatType = selectedConversation.chatType || 'member';
      const otherUserId = chatType === 'user' && selectedConversation.user 
        ? selectedConversation.user.userId 
        : undefined;

      if (isStarred) {
        // Unstar
        await chatService.unstarChat(selectedConversation.member.memberId, otherUserId);
        setIsStarred(false);
      } else {
        // Star
        await chatService.starChat(selectedConversation.member.memberId, otherUserId);
        setIsStarred(true);
      }

      // Notify parent to refresh conversation list
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
      // Revert state on error
      setIsStarred(!isStarred);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedConversation) return;
    
    setShowMenu(false);

    try {
      const chatType = selectedConversation.chatType || 'member';
      const blockedUserId = chatType === 'user' && selectedConversation.user 
        ? selectedConversation.user.userId 
        : undefined;

      await chatService.blockUser(selectedConversation.member.memberId, blockedUserId);
      
      // Update block status - I blocked them
      setBlockStatus({
        isBlocked: true,
        iBlockedThem: true,
        theyBlockedMe: false
      });

      // Notify parent to refresh conversation list
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      console.error('Failed to block user:', err);
      alert('Failed to block user. Please try again.');
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedConversation) return;
    
    setShowMenu(false);

    try {
      const chatType = selectedConversation.chatType || 'member';
      const blockedUserId = chatType === 'user' && selectedConversation.user 
        ? selectedConversation.user.userId 
        : undefined;

      await chatService.unblockUser(selectedConversation.member.memberId, blockedUserId);
      
      // Clear block status
      setBlockStatus({
        isBlocked: false,
        iBlockedThem: false,
        theyBlockedMe: false
      });

      // Notify parent to refresh conversation list
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      console.error('Failed to unblock user:', err);
      alert('Failed to unblock user. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId) return;

    try {
      // Optimistically remove the message
      const deletedMessage = messages.find(m => m._id === messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));

      await chatService.deleteMessage(messageId);

      // Notify parent to refresh conversation list (to update last message)
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
      
      // Restore message on error
      const deletedMessage = messages.find(m => m._id === messageId);
      if (deletedMessage) {
        setMessages(prev => [...prev, deletedMessage].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ));
      }
      
      alert('Unable to delete message. Please try again.');
    }
  };

  if (!selectedConversation) {
    return (
      <section className="flex flex-col items-center justify-center h-full bg-white px-8 rounded-[20px] overflow-hidden border border-[#E7DAC8]">
        <div className="max-w-md text-center">
          {/* Illustration */}
          <div className="mb-6 flex justify-center">
            <img 
              src="/assets/inbox/new_chat.svg" 
              alt="Start a new chat" 
              className="w-[291px] h-[225px]"
            />
          </div>

          <h2 className="font-montserrat text-2xl font-extrabold text-zinc-900 mb-3">
            Start a New Chat
          </h2>
          <p className="font-source text-base text-zinc-600 leading-relaxed mb-6">
            Select a conversation from the list to start messaging with your connections.
          </p>
        </div>
      </section>
    );
  }

  const member = selectedConversation.member;
  const chatType = selectedConversation.chatType || 'member';
  
  // Determine display information based on chat type
  let displayName: string;
  let displaySubtitle: string | undefined;
  let logoUrl: string | undefined;
  
  if (chatType === 'user' && selectedConversation.user) {
    // Check if this is a true user-to-user chat or member-level chat
    // Primary users represent the organization, so show company name for them
    const isPrimaryUser = selectedConversation.user.userType === 'Primary';
    
    if (isPrimaryUser) {
      // Primary user represents the organization - show company name
      displayName = member.companyName || 'Company Name';
      displaySubtitle = member.address 
        ? [member.address.city, member.address.country].filter(Boolean).join(', ')
        : undefined;
      logoUrl = member.logo;
    } else {
      // True user-to-user chat with secondary user - show individual name
      displayName = `${selectedConversation.user.firstName} ${selectedConversation.user.lastName}`;
      displaySubtitle = member.companyName || undefined;
      logoUrl = selectedConversation.user.profileImageUrl || member.logo;
    }
  } else {
    // Member-level chat - always show company name
    displayName = member.companyName || 'Company Name';
    displaySubtitle = member.address 
      ? [member.address.city, member.address.country].filter(Boolean).join(', ')
      : undefined;
    logoUrl = member.logo;
  }

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message) => {
    const dateKey = new Date(message.createdAt).toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <section className='flex flex-col h-full bg-white rounded-[20px] overflow-hidden border border-[#E7DAC8]'>
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-wfzo-gold-200 bg-white">
        <div className="w-10 h-10 rounded-full bg-wfzo-gold-200 flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-wfzo-gold-600 font-semibold">
              {displayName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-source text-base font-semibold text-zinc-900">
            {displayName}
          </h3>
          {displaySubtitle && (
            <p className="font-source text-xs text-zinc-500">
              {displaySubtitle}
            </p>
          )}
        </div>
        
        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5 text-zinc-600" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50">
              <button
                onClick={handleStarChat}
                className="w-full px-4 py-2 text-left hover:bg-zinc-50 flex items-center gap-3 text-sm text-zinc-700"
              >
                <Star className={cn("w-4 h-4", isStarred && "fill-yellow-400 text-yellow-400")} />
                <span>{isStarred ? 'Unstar this chat' : 'Star this chat'}</span>
              </button>
              
              {!blockStatus?.iBlockedThem ? (
                <button
                  onClick={handleBlockUser}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-50 flex items-center gap-3 text-sm text-red-600"
                >
                  <Ban className="w-4 h-4" />
                  <span>Block user from messaging</span>
                </button>
              ) : (
                <button
                  onClick={handleUnblockUser}
                  className="w-full px-4 py-2 text-left hover:bg-zinc-50 flex items-center gap-3 text-sm text-zinc-700"
                >
                  <Ban className="w-4 h-4" />
                  <span>Unblock user</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Blocked State Message */}
      {blockStatus?.iBlockedThem && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="font-source text-sm text-red-700 text-center">
            You have blocked this user. You are no longer connected
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 bg-zinc-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wfzo-gold-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-wfzo-gold-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-wfzo-gold-600" />
              </div>
              <h3 className="font-montserrat text-xl font-bold text-zinc-900 mb-2">
                No messages yet
              </h3>
              <p className="font-source text-sm text-zinc-600">
                Start the conversation by sending the first message!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Load More Trigger - placed at the top */}
            {hasMoreMessages && (
              <div ref={loadMoreTriggerRef} className="flex justify-center py-4 min-h-[50px]">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-wfzo-gold-600"></div>
                    <span>Loading older messages...</span>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400">Scroll up for older messages</div>
                )}
              </div>
            )}

            {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
              <div key={dateKey}>
                {/* Date Divider */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-zinc-200 rounded-full px-3 py-1">
                    <span className="font-source text-xs font-medium text-zinc-600">
                      {formatMessageDate(dateMessages[0].createdAt)}
                    </span>
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-3">
                  {dateMessages.map((message) => {
                    // Determine if message was sent by current user
                    let isSentByMe: boolean;
                    
                    const chatType = selectedConversation?.chatType || 'member';
                    const isInternalChat = chatType === 'user' && 
                      authMember && 
                      selectedConversation?.member.memberId === (authMember as any).memberId;
                    
                    if (isInternalChat && loggedInUserId && message.senderUserId) {
                      // For internal team chats, use senderUserId to determine sender
                      isSentByMe = message.senderUserId === loggedInUserId;
                    } else {
                      // For external chats, use senderId (memberId)
                      isSentByMe = message.senderId !== member.memberId;
                    }
                    
                    const messageType = message.type || 'text';

                    return (
                      <div
                        key={message._id}
                        className={cn(
                          'flex items-start gap-2 group',
                          isSentByMe ? 'justify-end' : 'justify-start'
                        )}
                        onMouseEnter={() => setHoveredMessageId(message._id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                      >
                        {/* Delete button for sent messages (hover only) */}
                        {isSentByMe && hoveredMessageId === message._id && (
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="mt-2 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}

                        <div
                          className={cn(
                            'max-w-[70%] rounded-lg px-4 py-2',
                            isSentByMe
                              ? 'bg-wfzo-gold-600 text-white'
                              : 'bg-white border border-zinc-200 text-zinc-900'
                          )}
                        >
                          {/* Render based on message type */}
                          {(messageType === 'image' || messageType === 'document') && message.fileUrl ? (
                            <MessageAttachment message={message} isSentByMe={isSentByMe} />
                          ) : (
                            <p className="font-source text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}
                          
                          <div className={cn(
                            'flex items-center gap-1 mt-1',
                            isSentByMe ? 'justify-end' : 'justify-start'
                          )}>
                            <span
                              className={cn(
                                'font-source text-xs',
                                isSentByMe ? 'text-wfzo-gold-100' : 'text-zinc-400'
                              )}
                            >
                              {formatMessageTime(message.createdAt)}
                            </span>
                            {/* Show blue double tick only for sent messages that are read */}
                            {isSentByMe && message.isRead && (
                              <CheckCheck className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-wfzo-gold-200 bg-white">
        {/* File Preview */}
        {uploadedFile && (
          <div className="mb-3 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
            <div className="flex items-start gap-3">
              {uploadedFile.type === 'image' && uploadedFile.preview ? (
                <img
                  src={uploadedFile.preview}
                  alt={uploadedFile.fileName}
                  className="w-16 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-16 bg-zinc-200 rounded flex items-center justify-center">
                  <FileText className="w-8 h-8 text-zinc-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-source text-sm font-medium text-zinc-900 truncate">
                  {uploadedFile.fileName}
                </p>
                <p className="font-source text-xs text-zinc-500">
                  {(uploadedFile.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={handleFileSelect}
            disabled={isUploading || isSending || !!uploadedFile || blockStatus?.iBlockedThem}
            className="p-2.5 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 hover:text-wfzo-gold-600 transition-colors disabled:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400"
            title="Attach File"
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-wfzo-gold-600"></div>
            ) : (
              <img src="/assets/inbox/attachment.svg" alt="Attach" className="w-5 h-5" />
            )}
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={blockStatus?.iBlockedThem ? "You have blocked this user" : (uploadedFile ? "Add a caption (optional)..." : "Type your message...")}
            disabled={isSending || isUploading || blockStatus?.iBlockedThem}
            className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-lg font-source text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-wfzo-gold-400 focus:border-transparent disabled:bg-zinc-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !uploadedFile) || isSending || isUploading || blockStatus?.iBlockedThem}
            className="px-6 py-2.5 bg-wfzo-gold-600 text-white rounded-lg font-source text-sm font-semibold hover:bg-wfzo-gold-700 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ChatWindow;
