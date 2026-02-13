"use client";

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { inboxService } from '../services/inboxService';
import type { Connection } from '../types';
import type { Conversation } from '@/services/chatService';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnection: (conversation: Conversation) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onSelectConnection,
}) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

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

  const filteredConnections = React.useMemo(() => {
    if (!searchQuery.trim()) return connections;

    const query = searchQuery.toLowerCase();
    return connections.filter((conn) => {
      const companyName = conn.member?.organisationInfo?.companyName || '';
      const location = [
        conn.member?.organisationInfo?.address?.city,
        conn.member?.organisationInfo?.address?.state,
        conn.member?.organisationInfo?.address?.country,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        companyName.toLowerCase().includes(query) ||
        location.toLowerCase().includes(query)
      );
    });
  }, [connections, searchQuery]);

  const handleSelectConnection = (connection: Connection) => {
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
      },
      lastMessage: {
        content: '',
        createdAt: new Date().toISOString(),
        senderId: '',
      },
      unreadCount: 0,
      chatType: 'member', // Default to member-level chat
    };

    onSelectConnection(conversation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
            <h2 className="font-montserrat text-xl font-bold text-zinc-900">
              New Chat
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-4 border-b border-zinc-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search connections..."
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg font-source text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-wfzo-gold-400 focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Connections List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wfzo-gold-600"></div>
              </div>
            ) : filteredConnections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <p className="font-source text-sm text-zinc-500">
                  {searchQuery ? 'No connections found' : 'No connections available'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {filteredConnections.map((connection) => {
                  const member = connection.member;
                  const companyName = member?.organisationInfo?.companyName || 'Company Name';
                  const logoUrl = member?.organisationInfo?.memberLogoUrl;
                  const location = member?.organisationInfo?.address
                    ? [
                        member?.organisationInfo?.address?.city,
                        member?.organisationInfo?.address?.state,
                      ]
                        .filter(Boolean)
                        .join(', ')
                    : '';

                  return (
                    <button
                      key={connection.connectionId}
                      onClick={() => handleSelectConnection(connection)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors text-left"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-wfzo-gold-200 flex items-center justify-center overflow-hidden">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={companyName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-wfzo-gold-600 font-semibold text-lg">
                              {companyName.charAt(0)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-source text-sm font-semibold text-zinc-900 mb-0.5 truncate">
                          {companyName}
                        </h3>
                        {location && (
                          <p className="font-source text-xs text-zinc-500 truncate">
                            {location}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NewChatModal;
