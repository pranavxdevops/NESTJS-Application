import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function GET(
  _req: Request,
  context: { params: Promise<{ tag: string }> }
) {
  // ✅ Must await params in Next.js 15+
  const { tag } = await context.params;

  const cacheTag = `/api/${tag}`;

  try {
    revalidateTag(cacheTag);

    return NextResponse.json({
      revalidated: true,
      tag: cacheTag,
      now: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to revalidate',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
