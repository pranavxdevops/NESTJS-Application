export interface DocumentUploadResponse {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  mediaKind: string;
  isPublic: boolean;
  createdAt: string;
  variants: Array<{
    key: string;
    url: string;
    contentType: string;
    size: number;
    ready: boolean;
  }>;
  publicUrl: string; // Signed URL with 12h expiry
  urlExpiresAt?: string; // ISO timestamp when the signed URL expires
  urlExpiresIn?: number; // Seconds until expiration
}

export type DocumentPurpose = 'member-logo' | 'member-license' | 'company-image' | 'memberSignature' | 'other';

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

export async function uploadDocument(
  file: File,
  purpose: DocumentPurpose,
  memberId?: string
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('mediaKind', file.type.startsWith('image/') ? 'image' : 'document');
  formData.append('purpose', purpose);
  formData.append('fileName', file.name);
  formData.append('contentType', file.type);
  formData.append('isPublic', 'true');
  if (memberId) {
    formData.append('memberId', memberId);
  }

  const response = await fetch('/api/document/upload', {
    method: 'POST',
    body: formData,
  });

  return handleResponse<DocumentUploadResponse>(response, 'Failed to upload document');
}


export async function RemoveDocument(  url?: string
): Promise<void> {
  if(!url) return;

  

  const response = await fetch('/api/document/remove', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
 console.log(response);
 
  return handleResponse<void>(response, 'Failed to remove document');
}