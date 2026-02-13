import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/wfzo/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const enquiryType = searchParams.get('enquiryType');
  const queryString = enquiryType ? `?enquiryType=${enquiryType}` : '';

  const authHeader = request.headers.get('authorization');

  const response = await fetch(`${API_BASE_URL}/enquiries${queryString}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY!,
      ...(authHeader && { 'Authorization': authHeader }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json({ error: errorData.message || 'Failed to fetch' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}