import { NextRequest, NextResponse } from 'next/server';
import { getMembershipFeatures } from '@/services/membershipService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const features = await getMembershipFeatures(type, {
      next: {
        revalidate: 3600, // Cache for 1 hour
        tags: ['membership-features', `${type}-features`],
      },
    });

    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching membership features:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Membership type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch membership features' },
      { status: 500 }
    );
  }
}
