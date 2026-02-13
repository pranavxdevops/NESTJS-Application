import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const { memberId } = await params;
  const targetUrl = `${API_BASE_URL}/wfzo/api/v1/member/save/${encodeURIComponent(memberId)}`;

  try {
    const body = await request.json();

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
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
      error instanceof Error ? error.message : 'Failed to update member application';
    return NextResponse.json({ message }, { status: 500 });
  }
}
