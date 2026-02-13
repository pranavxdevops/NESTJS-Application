import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
  const { tag } = await req.json();
  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
