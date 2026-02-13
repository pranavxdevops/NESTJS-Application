import type { FormField } from '@/shared/components/DynamicForm/types';

export interface Phase2FormFieldsResponse {
  page: string;
  locale: string;
  formFields: FormField[];
}

export interface MemberApplication {
  id: string;
  category: string;
  status: string;
  organisationInfo: {
    companyName?: string;
    websiteUrl?: string;
    typeOfTheOrganization?: string;
    industries?: string[];
    position?: string;
    organisationContactNumber?: string;
  };
  userSnapshots: Array<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    designation?: string;
    contactNumber?: string;
    newsLetterSubscription?: boolean;
  }>;
  memberConsent?: Record<string, boolean>;
  [key: string]: unknown;
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

export async function fetchPhase2FormFields(locale: string): Promise<FormField[]> {
  const url = `/api/member-registration/phase2-form-fields?locale=${encodeURIComponent(locale)}`;
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  });
  const data = await handleResponse<Phase2FormFieldsResponse>(
    response,
    'Unable to load Phase 2 form fields'
  );
  return data.formFields.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function fetchMemberApplication(applicationId: string): Promise<MemberApplication> {
  const url = `/api/member-registration/application/${encodeURIComponent(applicationId)}`;
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  });
  return handleResponse<MemberApplication>(response, 'Unable to load member application');
}

export async function submitPhase2Application(
  memberId: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(`/api/member-registration/application/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Record<string, unknown>>(
    response,
    'Unable to submit Phase 2 application'
  );
}
export async function savePhase2Application(
  memberId: string,
  payload: Record<string, unknown>
) {
  const response = await fetch(`/api/member-registration/application/save/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Record<string, unknown>>(
    response,
    'Unable to submit Phase 2 application'
  );
}

export async function fetchAdmissionCriteria(): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/info-sections?filters[slug][eq]=admissionCriteriaInfo`, {
    next: { revalidate: 86400 } // 1 day in seconds
  });

  if (!response.ok) {
    throw new Error('Failed to fetch admission criteria info');
  }

  const data = await response.json();
  if (data && data.data && data.data.length > 0 && data.data[0].Description) {
    return data.data[0].Description;
  }

  return 'No admission criteria information available.';
}
