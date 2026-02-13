import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const MARK_READ_PATH = '/wfzo/api/v1/chat/mark-read';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { otherMemberId } = body;

    if (!otherMemberId) {
      return NextResponse.json(
        { message: 'otherMemberId is required' },
        { status: 400 }
      );
    }

    const targetUrl = `${API_BASE_URL}${MARK_READ_PATH}`;

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');

    const response = await fetch(targetUrl, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({ otherMemberId }),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark messages as read';
    return NextResponse.json({ message }, { status: 500 });
  }
}
