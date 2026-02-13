"use client";

import React, { useState, useEffect } from 'react';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import ConnectionList from '../components/ConnectionList';
import type { Conversation } from '@/services/chatService';
import type { Connection, User } from '../types';
import HeroAuth from '@/features/events/dashboard/component/HeroAuth';


const InboxPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | undefined>();
  const [showNewChat, setShowNewChat] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Check for openChat data from sessionStorage on mount
  useEffect(() => {
    const openChatData = sessionStorage.getItem('openChat');
    if (openChatData) {
      try {
        const chatData = JSON.parse(openChatData);
        
        // Create conversation based on the chat data
        const conversation: Conversation = {
          member: {
            _id: '',
            memberId: chatData.memberId,
            companyName: chatData.companyName || '',
            logo: chatData.logo,
            address: {},
            primaryUsers: [],
            secondaryUsers: [],
          },
          lastMessage: {
            content: '',
            createdAt: new Date().toISOString(),
            senderId: '',
          },
          unreadCount: 0,
          chatType: chatData.type === 'user' ? 'user' : 'member',
          user: chatData.user ? {
            userId: `${chatData.user.firstName}_${chatData.user.lastName}`,
            firstName: chatData.user.firstName,
            lastName: chatData.user.lastName,
            email: '', // Not available from connections
            designation: chatData.user.designation || '',
            userType: 'Secondary' as const, // Default to Secondary
            profileImageUrl: chatData.user.userLogoUrl,
          } : undefined,
        };

        setSelectedConversation(conversation);
        setShowNewChat(false);
        
        // Clear the sessionStorage after using it
        sessionStorage.removeItem('openChat');
      } catch (error) {
        console.error('Error parsing openChat data:', error);
        sessionStorage.removeItem('openChat');
      }
    }
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowNewChat(false); // Exit new chat mode when selecting a conversation
  };

  const handleSelectConnection = (connection: Connection, user?: User) => {
    // Convert Connection to Conversation format
    const conversation: Conversation = {
      member: {
        _id: connection.member._id,
        memberId: connection.member.memberId,
        companyName: connection.member?.organisationInfo?.companyName || '',
        logo: connection.member?.organisationInfo?.memberLogoUrl,
        address: {
          city: connection.member?.organisationInfo?.address?.city,
          country: connection.member?.organisationInfo?.address?.country,
        },
        primaryUsers: connection.member.primaryUsers,
        secondaryUsers: connection.member.secondaryUsers,
      },
      lastMessage: {
        content: '',
        createdAt: new Date().toISOString(),
        senderId: '',
      },
      unreadCount: 0,
      chatType: user ? 'user' : 'member',
      user: user,
    };
    
    setSelectedConversation(conversation);
    setShowNewChat(false); // Exit new chat mode after selecting
  };

  const handleNewChat = () => {
    setShowNewChat(true);
  };

  const handleBackToMessages = () => {
    setShowNewChat(false);
  };

  const handleMessageSent = () => {
    // Trigger a refresh of the conversation list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      <HeroAuth backgroundImage="https://api.builder.io/api/v1/image/assets/TEMP/cf38272f75b0b13150ab286d5c652b2c761f8324?width=2880"/>

      {/* Inbox Container */}
      <div className="px-5 md:px-30 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-montserrat text-3xl font-extrabold text-wfzo-grey-900">
            Inbox
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[379px_1fr] gap-4 h-[624px] rounded-[20px] overflow-hidden">
          {/* Left: Conversation List or Connection List */}
          {showNewChat ? (
            <ConnectionList
              selectedConnectionId={selectedConversation?.member.memberId}
              onSelectConnection={handleSelectConnection}
              onBack={handleBackToMessages}
              className="border-r border-zinc-200"
            />
          ) : (
            <ConversationList
              selectedMemberId={selectedConversation?.member.memberId}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
              refreshTrigger={refreshTrigger}
              showStarredOnly={showStarredOnly}
              selectedConversation={selectedConversation}
              className="border-r border-zinc-200"
            />
          )}

          {/* Right: Chat Window */}
          <ChatWindow 
            selectedConversation={selectedConversation}
            onMessageSent={handleMessageSent}
          />
        </div>
      </div>
    </div>
  );
};

export default InboxPage;
