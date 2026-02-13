import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

/**
 * Refresh document URL endpoint
 * Generates a new signed URL for a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const variant = searchParams.get('variant') || 'original';
    const inline = searchParams.get('inline') === 'true';

    const targetUrl = `${API_BASE_URL}/wfzo/api/v1/document/${id}/download?variant=${variant}&inline=${inline}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to refresh document URL' }));
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();

    // Return in the format expected by useAutoRefreshUrl
    return NextResponse.json({
      url: data.url,
      expiresAt: data.expiresAt,
      expiresIn: 43200, // 12 hours in seconds
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to refresh document URL';
    return NextResponse.json({ message }, { status: 500 });
  }
}
