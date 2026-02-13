/**
 * Profile Service
 * Handles profile-related API calls including profile photo updates
 */

export interface UpdateProfilePhotoPayload {
  memberId: string;
  userEmail: string;
  photoUrl: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  designation: string;
  userType: string;
  action?: string;
}
export interface UserSnapshot {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'Primary' | 'Secondry';
  contactNumber: string;
  designation?: string;
  profileImageUrl?: string;
  lastSyncedAt?: string;
}
export interface MemberResponse {
  _id: string;
  memberId: string;
  userSnapshots: UserSnapshot[];
}
export interface CreateUserResponse {
  success: boolean;
  message: string;
  member: MemberResponse;
}

export interface EnquiryResponse {
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
  enquiryStatus: 'pending' | 'approved' | 'rejected';
  memberId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    let message = fallbackMessage;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody === 'object' && 'message' in errorBody) {
        const value = (errorBody as Record<string, unknown>).message;
        if (typeof value === 'string' && value.trim()) {
          message = value;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to parse error response', error);
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

/**
 * Update user's profile photo
 * @param payload - Contains memberId, userEmail, and photoUrl
 */
export async function updateProfilePhoto(
  payload: UpdateProfilePhotoPayload
): Promise<void> {
  const response = await fetch(`/api/profile/update-photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<void>(response, 'Failed to update profile photo');
}

/**
 * Refresh member data from the API
 * @param email - User's email
 */
export async function refreshMemberData(email: string): Promise<any> {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL!).replace(/\/$/, '');
  const targetUrl = `${API_BASE_URL}/wfzo/api/v1/member/me`;

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return handleResponse<any>(response, 'Failed to refresh member data');
}

/**
 * Create a new user via API
 * @param memberId - The member ID to create user under
 * @param payload - User creation data
 */
export async function createUser(memberId: string, payload: CreateUserPayload): Promise<CreateUserResponse> {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL!).replace(/\/$/, '');
  const targetUrl = `${API_BASE_URL}/wfzo/api/v1/member/${memberId}`;

  const response = await fetch(targetUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<CreateUserResponse>(response, 'Failed to create user');
}

/**
 * Update a team member via API
 * @param memberId - The member ID
 * @param userSnapshotId - The user snapshot ID to update
 * @param payload - User update data
 */
export async function updateTeamMember(
  memberId: string,
  userSnapshotId: string,
  payload: Partial<CreateUserPayload>
): Promise<CreateUserResponse> {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL!).replace(/\/$/, '');
  const targetUrl = `${API_BASE_URL}/wfzo/api/v1/member/${memberId}/user/${userSnapshotId}`;

  const response = await fetch(targetUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleResponse<CreateUserResponse>(response, 'Failed to update team member');
}

/**
 * Delete a team member via API
 * @param memberId - The member ID
 * @param userSnapshotId - The user snapshot ID to delete
 */
export async function deleteTeamMember(memberId: string, userSnapshotId: string): Promise<void> {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL!).replace(/\/$/, '');
  const targetUrl = `${API_BASE_URL}/wfzo/api/v1/member/${memberId}/user/${userSnapshotId}`;

  const response = await fetch(targetUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return handleResponse<void>(response, 'Failed to delete team member');
}
/**
 * Fetch member enquiry data by enquiry type
 * @param memberId - The member ID
 * @param enquiryType - The type of enquiry (e.g., "add_team_member")
 * @returns Array of enquiries or null if none exist
 */
export async function fetchMemberEnquiry(memberId: string, enquiryType: string): Promise<EnquiryResponse[] | null> {
  const targetUrl = `/api/enquiries/member/${memberId}?enquiryType=${enquiryType}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Return null if enquiry doesn't exist or endpoint returns error
      return null;
    }

    const data = await response.json();
    // API returns an array directly, return full array if exists and has items
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch (error) {
    console.error('Error fetching member enquiry:', error);
    return null;
  }
}