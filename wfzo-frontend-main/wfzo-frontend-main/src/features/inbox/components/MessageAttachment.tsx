"use client";

import React, { useMemo } from 'react';
import { Download, FileText } from 'lucide-react';
import { useAutoRefreshUrl } from '@/lib/blob/useAutoRefreshUrl';
import { cn } from '@/lib/utils/cn';
import type { Message } from '@/services/chatService';

interface MessageAttachmentProps {
  message: Message;
  isSentByMe: boolean;
}

export const MessageAttachment: React.FC<MessageAttachmentProps> = ({ message, isSentByMe }) => {
  // Prepare signed URL data for auto-refresh
  const fileUrlData = useMemo(() => {
    if (message.fileUrlExpiresAt && message.fileUrl && message.fileUrlExpiresIn) {
      return {
        url: message.fileUrl,
        expiresAt: message.fileUrlExpiresAt,
        expiresIn: message.fileUrlExpiresIn,
      };
    }
    return message.fileUrl || null;
  }, [message.fileUrl, message.fileUrlExpiresAt, message.fileUrlExpiresIn]);

  const { url: currentFileUrl } = useAutoRefreshUrl(fileUrlData);

  if (!currentFileUrl || !message.fileUrl) {
    return null;
  }

  const messageType = message.type || 'text';

  if (messageType === 'image') {
    return (
      <div className="space-y-2">
        <img
          src={currentFileUrl}
          alt={message.fileName || 'Image'}
          className="rounded-lg max-w-full h-auto cursor-pointer"
          onClick={() => window.open(currentFileUrl, '_blank')}
        />
        {message.content && (
          <p className="font-source text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
      </div>
    );
  }

  if (messageType === 'document') {
    return (
      <div className="space-y-2">
        <a
          href={currentFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center gap-2 p-2 rounded border',
            isSentByMe
              ? 'border-wfzo-gold-400 bg-wfzo-gold-500 hover:bg-wfzo-gold-400'
              : 'border-zinc-300 bg-zinc-50 hover:bg-zinc-100'
          )}
        >
          <FileText className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-source text-sm font-medium truncate">
              {message.fileName}
            </p>
            {message.fileSize && (
              <p className={cn(
                'font-source text-xs',
                isSentByMe ? 'text-wfzo-gold-100' : 'text-zinc-500'
              )}>
                {(message.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
          <Download className="w-4 h-4 flex-shrink-0" />
        </a>
        {message.content && (
          <p className="font-source text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        )}
      </div>
    );
  }

  return null;
};
