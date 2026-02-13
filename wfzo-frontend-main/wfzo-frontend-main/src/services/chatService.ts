import { apiClient } from '@/lib/api/apiClient';

export interface Message {
  _id: string;
  senderId: string;
  recipientId: string;
  senderUserId?: string;
  recipientUserId?: string;
  content: string;
  type?: 'text' | 'image' | 'document';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  fileUrlExpiresAt?: string;
  fileUrlExpiresIn?: number;
  isRead: boolean;
  readAt?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  userType: 'Primary' | 'Secondary';
  profileImageUrl?: string;
}

export interface ConversationMember {
  _id: string;
  memberId: string;
  companyName: string;
  logo?: string;
  address?: {
    city?: string;
    country?: string;
  };
  primaryUsers?: User[];
  secondaryUsers?: User[];
}

export interface Conversation {
  member: ConversationMember;
  lastMessage: {
    content: string;
    createdAt: string;
    senderId: string;
    senderUserId?: string;
    recipientUserId?: string;
  };
  unreadCount: number;
  chatType: 'member' | 'user';
  user?: User;
  isStarred?: boolean;
  blockStatus?: {
    isBlocked: boolean;
    iBlockedThem: boolean;
    theyBlockedMe: boolean;
  };
}

export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

export interface MessagesResponse {
  success: boolean;
  data: Message[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  blockStatus?: {
    isBlocked: boolean;
    iBlockedThem: boolean;
    theyBlockedMe: boolean;
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
  data: {
    modifiedCount: number;
  };
}

export interface UploadFileResponse {
  success: boolean;
  message: string;
  data: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    type: 'image' | 'document';
  };
}

export interface StarChatResponse {
  success: boolean;
  message: string;
}

export interface UnstarChatResponse {
  success: boolean;
  message: string;
}

export interface BlockUserResponse {
  success: boolean;
  message: string;
}

export interface UnblockUserResponse {
  success: boolean;
  message: string;
}

export interface DeleteMessageResponse {
  success: boolean;
  message: string;
}

export const chatService = {
  /**
   * Get conversations list sorted by latest message
   */
  async getConversations(page: number = 1, pageSize: number = 10): Promise<ConversationsResponse> {
    const response = await apiClient.get('/wfzo/api/v1/chat/conversations', {
      params: { page, pageSize },
    });
    return response.data;
  },

  /**
   * Get messages with a specific member
   */
  async getMessages(
    otherMemberId: string,
    otherUserId?: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<MessagesResponse> {
    const params: any = { otherMemberId, page, pageSize };
    if (otherUserId) {
      params.otherUserId = otherUserId;
    }
    
    const response = await apiClient.get('/wfzo/api/v1/chat/messages', {
      params,
    });
    return response.data;
  },

  /**
   * Send a message to another member
   */
  async sendMessage(
    recipientId: string,
    content: string,
    recipientUserId?: string,
    fileData?: {
      type: 'image' | 'document';
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
  ): Promise<SendMessageResponse> {
    const body: any = {
      recipientId,
      content,
    };

    if (recipientUserId) {
      body.recipientUserId = recipientUserId;
    }

    if (fileData) {
      body.type = fileData.type;
      body.fileUrl = fileData.fileUrl;
      body.fileName = fileData.fileName;
      body.fileSize = fileData.fileSize;
      body.mimeType = fileData.mimeType;
    }
    
    const response = await apiClient.post('/wfzo/api/v1/chat/send', body);
    return response.data;
  },

  /**
   * Mark all messages from a member as read
   */
  async markAsRead(otherMemberId: string, otherUserId?: string): Promise<MarkAsReadResponse> {
    const body: any = { otherMemberId };
    if (otherUserId) {
      body.otherUserId = otherUserId;
    }
    
    const response = await apiClient.put('/wfzo/api/v1/chat/mark-read', body);
    return response.data;
  },

  /**
   * Upload a file (image or document) for chat
   */
  async uploadFile(file: File): Promise<UploadFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/wfzo/api/v1/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Star a chat conversation
   */
  async starChat(otherMemberId: string, otherUserId?: string): Promise<StarChatResponse> {
    const body: any = { otherMemberId };
    if (otherUserId) {
      body.otherUserId = otherUserId;
    }
    
    const response = await apiClient.post('/wfzo/api/v1/chat/star', body);
    return response.data;
  },

  /**
   * Unstar a chat conversation
   */
  async unstarChat(otherMemberId: string, otherUserId?: string): Promise<UnstarChatResponse> {
    const body: any = { otherMemberId };
    if (otherUserId) {
      body.otherUserId = otherUserId;
    }
    
    const response = await apiClient.post('/wfzo/api/v1/chat/unstar', body);
    return response.data;
  },

  /**
   * Block a user from messaging
   */
  async blockUser(blockedMemberId: string, blockedUserId?: string): Promise<BlockUserResponse> {
    const body: any = { blockedMemberId };
    if (blockedUserId) {
      body.blockedUserId = blockedUserId;
    }
    
    const response = await apiClient.post('/wfzo/api/v1/chat/block-user', body);
    return response.data;
  },

  /**
   * Unblock a user from messaging
   */
  async unblockUser(blockedMemberId: string, blockedUserId?: string): Promise<UnblockUserResponse> {
    const body: any = { blockedMemberId };
    if (blockedUserId) {
      body.blockedUserId = blockedUserId;
    }
    
    const response = await apiClient.post('/wfzo/api/v1/chat/unblock-user', body);
    return response.data;
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<DeleteMessageResponse> {
    const response = await apiClient.delete(`/wfzo/api/v1/chat/message/${messageId}`);
    return response.data;
  },
};
