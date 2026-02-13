import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const DROPDOWN_PATH = '/wfzo/api/v1/masterdata/dropdowns/category';
const DEFAULT_LOCALE = 'en';

export const dynamic = 'force-dynamic'; // Prevent static generation

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || DEFAULT_LOCALE;
  const { category } = await params;

  const targetUrl = `${API_BASE_URL}${DROPDOWN_PATH}/${encodeURIComponent(category)}?locale=${encodeURIComponent(locale)}`;

  // Generate the API key
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: 'API_KEY environment variable is not set' }, { status: 500 });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type') || 'application/json';

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load dropdown values';
    return NextResponse.json({ message }, { status: 500 });
  }
}
