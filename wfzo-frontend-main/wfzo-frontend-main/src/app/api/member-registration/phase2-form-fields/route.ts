import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const FORM_FIELDS_PATH = '/wfzo/api/v1/masterdata/form-fields/member-registration-phase2';
const DEFAULT_LOCALE = 'en';

export const dynamic = 'force-dynamic'; // Prevent static generation

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || DEFAULT_LOCALE;
  const targetUrl = `${API_BASE_URL}${FORM_FIELDS_PATH}?locale=${encodeURIComponent(locale)}`;
  const apiKey = process.env.API_KEY;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
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
      error instanceof Error ? error.message : 'Failed to load Phase 2 form fields';
    return NextResponse.json({ message }, { status: 500 });
  }
}
