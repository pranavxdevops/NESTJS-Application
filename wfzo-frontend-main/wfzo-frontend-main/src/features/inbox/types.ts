export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  userType: 'Primary' | 'Secondary';
  profileImageUrl?: string;
}

export interface Member {
  _id: string;
  memberId: string;
  organisationInfo?: {
    companyName?: string;
    memberLogoUrl?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
    industries?: string[];
  };
  primaryUsers?: User[];
  secondaryUsers?: User[];
}

export interface Connection {
  connectionId: string;
  member: Member;
  connectedAt: string;
  status: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  connectionId: string;
  member: Member;
  lastMessage?: Message;
  unreadCount: number;
  chatType?: 'member' | 'user';
  user?: User;
}

export interface InboxResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore?: boolean;
  };
  message?: string;
}
