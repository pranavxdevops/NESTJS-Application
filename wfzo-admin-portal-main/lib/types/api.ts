// API Types based on Swagger schemas

export type UserRole = "Admin" | "Committee Member" | "Board Member" | "CEO";

export interface Role {
  code: string;
  name: string;
  description: string;
  privilegeCount: number;
}

export interface CreateInternalUserDto {
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
}

export interface InternalUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  roles: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InternalLoginRequestDto {
  email: string;
  password: string;
}

export interface InternalLoginResponseDto {
  token: string;
  expiresAt: string;
}

export interface InternalUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role: UserRole;
  roles?: string[]; // Multiple roles from JWT token
  token: string;
}

export type MemberStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";
export type WorkflowStage = "COMMITTEE" | "BOARD" | "CEO" | "PAYMENT";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AddressDto {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface OrganisationInfoDto {
  name: string;
  registrationNumber?: string;
  taxId?: string;
  industry?: string;
  website?: string;
  address?: AddressDto;
  phone?: string;
  email?: string;
}

export interface OrganisationQuestionnaireDto {
  question: string;
  answer: string;
}

export interface MemberConsentDto {
  termsAccepted: boolean;
  dataProcessingConsent: boolean;
  marketingConsent?: boolean;
}

export interface WorkflowHistory {
  stage: WorkflowStage;
  status: ApprovalStatus;
  approverName?: string;
  approverEmail?: string;
  approverRole?: string;
  comment?: string;
  timestamp: string;
  createdAt?: string;
}

export interface Member {
  _id: string;
  id?: string;
  memberId: string;
  applicationNumber?: string;
  category?: string;
  approvalHistory?: any[];
  featuredMember?: boolean;
  authorizedPersonDeclarations?: boolean;
  memberConsent?: {
    articleOfAssociationConsent?: boolean;
    articleOfAssociationCriteriaConsent?: boolean;
    memberShipFeeConsent?: boolean;
  };
  organisationInfo: {
    industries?: string[];
    memberLogoUrl?: string;
    memberLogoUrlExpiresAt?: string;
    memberLogoUrlExpiresIn?: number;
    memberLicenceUrl?: string;
    memberLicenceUrlExpiresAt?: string;
    memberLicenceUrlExpiresIn?: number;
    position?: string;
    signatoryName?: string;
    signature?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      country?: string;
      zip?: string;
      latitude?: number;
      longitude?: number;
    };
    [key: string]: any;
  };
  paymentStatus?: string;
  rejectionHistory?: any[];
  status?: string;
  updatedAt: string;
  userSnapshots?: any[];
  createdAt?: string;
  // Legacy fields for backward compatibility
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  membershipType?: string;
  organisationQuestionnaire?: OrganisationQuestionnaireDto[];
  consent?: MemberConsentDto;
  currentStage?: WorkflowStage;
  committeeApproval?: WorkflowHistory;
  boardApproval?: WorkflowHistory;
  ceoApproval?: WorkflowHistory;
  paymentLink?: string;
}

export interface UpdateStatusDto {
  action: 'approve' | 'reject';
  comment: string;
}

export interface ApprovalActionDto {
  action: 'approve' | 'reject';
  comment: string;
}

export interface UpdatePaymentLinkDto {
  paymentLink: string;
}

export interface UpdatePaymentStatusDto {
  paymentStatus: "pending" | "paid";
}

export interface PageDataDto<T> {
  items: T[];
  page: {
    total: number;
    page: number;
    pageSize: number;
  };
}

export type EventStatus = "Pending" | "Approved" | "Rejected";

export interface Event {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  organizer?: string;
  location?: string;
  city?: string;
  startDateTime?: string;
  endDateTime?: string;
  eventStatus: EventStatus;
  eventType?: string;
  singleDayEvent?: boolean;
  primaryEvent?: boolean;
  isOnline?: boolean;
  registrationUrl?: string;
  comments?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  image?: any;
  cta?: any;
  Seo?: any;
  internalLink?: any;
  event_details?: any[];
  eventPrimaryDetails?: any;
  media_items?: any[];
  fullPath?: string;
 authorName?: string;
  authorEmail?: string;
}
export interface Webinar {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  organizer?: string;
  location?: string;
  city?: string;
  startDate?: string;
  endDateTime?: string;
  webinarStatus: EventStatus;
  eventType?: string;
  singleDayEvent?: boolean;
  primaryEvent?: boolean;
  isOnline?: boolean;
  registrationUrl?: string;
  comments?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  image?: any;
  cta?: any;
  Seo?: any;
  internalLink?: any;
  webinar_details?: any[];
  eventPrimaryDetails?: any;
  media_items?: any[];
  fullPath?: string;
  authorName?: string;
  authorEmail?: string;
}

export interface Article {
  id: number;
  documentId: string;
  title: string;
  authorName: string;
  articleCategory: string;
  articleFormat: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  locale: string;
  organizationName: string;
  shortDescription: string;
  newsStatus: EventStatus;
  authorImage: string;
  authorEmail: string;
  slug: string;
  comments?: string;
  isFeatured: boolean;
  newsImage: {
    id: number;
    documentId: string;
    url: string;
  };
  pdfFile?: any;
  event_details: Array<{
    id: number;
    title: string;
    imagePosition?: string;
    description: string;
    image: {
      id: number;
      alternateText: string;
      href: string;
      image: {
        id: number;
        documentId: string;
        url: string;
      };
    };
  }>;
}

export interface StrapiResponse<T = any> {
  data: T;
  meta?: any;
}

export interface EcosystemCard {
  title: string;
  link: string;
  backgroundImage: {
    url?: string;
    formats?: {
      medium?: string;
    };
  };
}

export interface Enquiry {
  _id: string;
  userDetails: {
    firstName: string;
    lastName: string;
    organizationName: string;
    country: string;
    phoneNumber: string;
    email: string;
  };
  enquiryType: string;
  message: string;
  enquiryStatus: string;
  noOfMembers?: number;
  memberId?: string;
  comments?: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface SocialMediaHandle {
  title: string;
  url: string;
}
export interface Request {
  _id: string;
  organisationInfo: {
    companyName: string;
    websiteUrl: string;
    linkedInUrl: string;
    industries: string[];
    typeOfTheOrganization: string;
    position?: string;
    primaryContactDesignation?: string;
     socialMediaHandle?: SocialMediaHandle[];
     memberLogoUrl?: string;
  };
  memberId: string;
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Organization {
  id: number;
  documentId: string;
  organizationName: string;
  slug: string;
  companyIntro?: string;
  authorEmail?: string;
  companyStatus?: string;
  newsStatus?: string;
  companyImage?: {
    id: number;
    documentId: string;
    url: string;
  };
  organization?: Array<{
    id: number;
    title: string;
    imagePosition?: string;
    description: string;
    image?: {
      id: number;
      alternateText?: string;
      href?: string;
      image?: {
        id: number;
        documentId: string;
        url: string;
      };
    };
  }>;
  locale: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  comments?: string;
}

