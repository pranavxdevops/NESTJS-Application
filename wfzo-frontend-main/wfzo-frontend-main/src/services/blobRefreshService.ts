import { BlobUrlMetadata } from '@/lib/blob';

/**
 * Refresh a document's signed URL
 */
export async function refreshDocumentUrl(documentId: string): Promise<BlobUrlMetadata> {
  const response = await fetch(`/api/document/${documentId}/refresh`);
  
  if (!response.ok) {
    throw new Error('Failed to refresh document URL');
  }
  
  return response.json();
}

/**
 * Create a refresh callback for a specific document
 * Usage: onRefreshUrl={createDocumentRefreshCallback(documentId)}
 */
export function createDocumentRefreshCallback(documentId: string) {
  return async () => refreshDocumentUrl(documentId);
}

/**
 * Extract document ID from blob URL if possible
 * This is a best-effort function and may not work for all URL formats
 */
export function extractDocumentIdFromUrl(url: string): string | null {
  try {
    // Try to extract from common patterns
    // Example: /wfzo/api/v1/document/{id}/download
    const match = url.match(/\/document\/([a-f0-9-]+)\/download/i);
    if (match) {
      return match[1];
    }
    
    // Try blob path pattern
    // Example: images/memberId-purpose.ext or images/timestamp-uuid.ext
    const blobMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (blobMatch) {
      return blobMatch[1];
    }
    
    return null;
  } catch {
    return null;
  }
}
