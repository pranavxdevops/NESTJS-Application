import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const SEND_MESSAGE_PATH = '/wfzo/api/v1/chat/send';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, content } = body;

    if (!recipientId || !content) {
      return NextResponse.json(
        { message: 'recipientId and content are required' },
        { status: 400 }
      );
    }

    const targetUrl = `${API_BASE_URL}${SEND_MESSAGE_PATH}`;

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');

    const response = await fetch(targetUrl, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify({ recipientId, content }),
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return NextResponse.json({ message }, { status: 500 });
  }
}
