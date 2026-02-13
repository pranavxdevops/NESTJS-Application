import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const SUBMIT_PATH = '/wfzo/api/v1/member';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const response = await fetch(`${API_BASE_URL}${SUBMIT_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
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
    const message = error instanceof Error ? error.message : 'Failed to submit registration';
    return NextResponse.json({ message }, { status: 500 });
  }
}
