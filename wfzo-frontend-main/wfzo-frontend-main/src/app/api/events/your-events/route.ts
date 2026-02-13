import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgName = searchParams.get('organization') || '';

  try {
    const base = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;
    if (!base) return new NextResponse('Strapi base URL not configured', { status: 500 });

    const eventsUrl = `${base}/api/events?status=draft&filters[organizer][$eq]=${encodeURIComponent(orgName)}&sort[0]=startDateTime:asc&populate[image][populate][image][fields][0]=url&populate[image][populate][image][fields][1]=formats&populate[cta][populate]=*`;

    const res = await fetch(eventsUrl);
    if (!res.ok) {
      const msg = `Strapi returned ${res.status}`;
      return new NextResponse(msg, { status: 502 });
    }

    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (error) {
    console.error('Error proxying events:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
