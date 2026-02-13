import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'API_KEY environment variable is not set' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/').replace(/\/$/, '');
    const backendUrl = `${API_BASE_URL}/wfzo/api/v1/enquiries`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ message: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in enquiries POST:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}