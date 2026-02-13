export interface Member {
  _id: string;
  memberId: string;
  organisationInfo?: {
    companyName?: string;
    memberLogoUrl?: string;
    typeOfTheOrganization?: string;
    address?: {
      city?: string;
      state?: string;
      country?: string;
    };
    industries?: string[];
  };
  secondaryUsers?: TeamMember[];
  blockStatus?: string; // "blocked" | "none"
}

export interface TeamMember {
  userId?: string;
  email?: string;
  firstName: string;
  lastName: string;
  role?: string;
  designation?: string;
  userType?: string;
  profileImageUrl?: string;
  userLogoUrl?: string;
  blockStatus?: string; // "blocked" | "none"
  isBlocked?: boolean;
}

export interface ConnectionRequest {
  requestId: string;
  member: Member;
  note?: string;
  requestedAt: string;
}

export interface Connection {
  connectionId: string;
  member: Member;
  connectedAt: string;
  status: string;
  blockStatus?: string;
  teamMembers?: TeamMember[];
  isInternalTeam?: boolean;
}

export interface SuggestedMember {
  member: Member;
  mutualConnections: number;
  matchReason: string[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface NetworkResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationMeta;
  message?: string;
}
