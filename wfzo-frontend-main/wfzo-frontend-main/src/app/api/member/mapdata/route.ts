import { NextResponse } from 'next/server';


const DEFAULT_API_BASE = 'http://localhost:3001/';
const MAPDATA_PATH = 'wfzo/api/v1/member/mapdata/view-member';

export const revalidate = 300; // seconds
export const dynamic = 'force-dynamic'; // Prevent static generation for this route

export async function GET() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE;
  const url = `${apiBase}${MAPDATA_PATH}`;

  // Generate the API key hash
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ message: 'API_KEY environment variable is not set' }, { status: 500 });
  }
  
  try {
    const res = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
      },
      // Enable Next.js fetch caching with ISR-style revalidation
      next: { revalidate,
      tags: ['member-mapdata']
      },
      
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Upstream request failed', status: res.status },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate=${revalidate}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch map data', details: (error as Error).message },
      { status: 502 }
    );
  }
}
