import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent static generation

export async function GET(request: NextRequest, { params }: { params: Promise<{ memberId: string }> }) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: 'API_KEY environment variable is not set' }, { status: 500 });
  }

  try {
    const { memberId } = await params;
    const { searchParams } = new URL(request.url);
    const enquiryType = searchParams.get('enquiryType');

    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/').replace(/\/$/, '');
    let backendUrl = `${API_BASE_URL}/wfzo/api/v1/enquiries/member/${memberId}`;
    if (enquiryType) {
      backendUrl += `?enquiryType=${encodeURIComponent(enquiryType)}`;
    }

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
    console.error('Error in enquiries member GET:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}