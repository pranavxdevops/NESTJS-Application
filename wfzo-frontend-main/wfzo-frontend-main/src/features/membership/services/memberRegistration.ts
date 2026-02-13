export interface MemberRegistrationFieldTranslation {
  language: string;
  label: string;
  placeholder?: string;
  helpText?: string;
}

export type MemberRegistrationFieldType =
  | "text"
  | "email"
  | "url"
  | "phone"
  | "dropdown"
  | "checkbox";

export interface MemberRegistrationField {
  fieldKey: string;
  fieldType: MemberRegistrationFieldType;
  section: string;
  subSection?: string;
  translations: MemberRegistrationFieldTranslation[];
  dropdownCategory?: string;
  displayOrder: number;
  fieldsPerRow?: number;
}

export interface MemberRegistrationFieldsResponse {
  page: string;
  locale: string;
  formFields: MemberRegistrationField[];
}

export interface DropdownValue {
  category: string;
  code: string;
  label: string;
  displayOrder: number;
}

export interface DropdownResponse {
  category: string;
  locale: string;
  values: DropdownValue[];
}

export interface MemberRegistrationPayload {
  memberUsers: Array<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
    designation?: string;
    contactNumber?: string;
    newsLetterSubscription?: boolean;
  }>;
  category: string;
  status: string;
  organisationInfo: {
    typeOfTheOrganization?: string;
    companyName?: string;
    websiteUrl?: string;
    industries?: string[];
    position?: string;
    organisationContactNumber?: string;
  };
  memberConsent: Record<string, boolean>;
  featuredMember: boolean;
  categoryValidation: unknown;
}

async function handleResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    let message = fallbackMessage;
    try {
      const errorBody = await response.json();
      if (errorBody && typeof errorBody === "object" && "message" in errorBody) {
        const value = (errorBody as Record<string, unknown>).message;
        if (typeof value === "string" && value.trim()) {
          message = value;
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to parse error response", error);
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function fetchMemberRegistrationFields(locale: string): Promise<MemberRegistrationField[]> {
  const url = `/api/member-registration/form-fields`;
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });
  const data = await handleResponse<MemberRegistrationFieldsResponse>(
    response,
    "Unable to load registration form"
  );
  return data.formFields.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function fetchDropdownValues(category: string, locale: string): Promise<DropdownValue[]> {
  const url = `/api/member-registration/dropdowns/${encodeURIComponent(category)}?locale=${encodeURIComponent(locale)}`;
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });
  const data = await handleResponse<DropdownResponse>(response, "Unable to load dropdown values");
  return data.values.sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function submitMemberRegistration(payload: MemberRegistrationPayload) {
  const response = await fetch("/api/member-registration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<Record<string, unknown>>(response, "Unable to submit registration");
}
