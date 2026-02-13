import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '')}/wfzo/api/v1/requests/member/${memberId}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': process.env.API_KEY!,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: response.status });
    }

console.log("API KEY:", process.env.API_KEY);

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/requests/member/[memberId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}