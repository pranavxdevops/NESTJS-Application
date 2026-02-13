import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const UPLOAD_PATH = '/wfzo/api/v1/document/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const targetUrl = `${API_BASE_URL}${UPLOAD_PATH}`;

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload document';
    return NextResponse.json({ message }, { status: 500 });
  }
}
