import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent static generation

export async function GET(request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'API_KEY environment variable is not set' }, { status: 500 });
  }

  try {
    const { email } = await params;
    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/').replace(/\/$/, '');
    const backendUrl = `${API_BASE_URL}/wfzo/api/v1/mailerlite/subscribers/${encodeURIComponent(email)}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ message: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in mailerlite subscribers GET:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'API_KEY environment variable is not set' }, { status: 500 });
  }

  try {
    const { email } = await params;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
    const backendUrl = `${apiBaseUrl}/wfzo/api/v1/mailerlite/subscribers/${encodeURIComponent(email)}`;

    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ message: errorData }, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in mailerlite subscribers DELETE:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}