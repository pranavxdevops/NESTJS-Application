import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const CONVERSATIONS_PATH = '/wfzo/api/v1/chat/conversations';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const pageSize = searchParams.get('pageSize') || '10';
  
  const targetUrl = `${API_BASE_URL}${CONVERSATIONS_PATH}?page=${page}&pageSize=${pageSize}`;

  try {
    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');

    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load conversations';
    return NextResponse.json({ message }, { status: 500 });
  }
}
