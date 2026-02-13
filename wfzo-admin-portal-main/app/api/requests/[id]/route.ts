import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/wfzo/api/v1";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get('authorization');

  const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get('authorization');
  const body = await request.json();

  const response = await fetch(`${API_BASE_URL}/requests/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.API_KEY!,
      ...(authHeader && { 'Authorization': authHeader }),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json({ error: errorData.message || 'Failed to update' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}