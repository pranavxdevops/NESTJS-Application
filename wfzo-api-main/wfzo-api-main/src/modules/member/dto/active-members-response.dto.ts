export class ActiveMembersResponseDto {
  companyName?: string;
  industries?: string[];
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    countryCode?: string;
    zip?: string;
    latitude?: number;
    longitude?: number;
  };
  memberLogoUrl?: string;
  memberLogoUrlExpiresAt?: string; // ISO timestamp when signed URL expires
  memberLogoUrlExpiresIn?: number; // Seconds until expiration
  featuredMember?: boolean;
}
