import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const FILE_DELETE_PATH = '/wfzo/api/v1/document/delete-by-url';

export async function POST(request: NextRequest) {
  try {
    const url = await request.json();
    const targetUrl = `${API_BASE_URL}${FILE_DELETE_PATH}`;


    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(url),
    });

    
    const data = await response.json();
    
    
    console.log("Data from wfzo -api", data);
    

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload document';
    return NextResponse.json({ message }, { status: 500 });
  }
}
