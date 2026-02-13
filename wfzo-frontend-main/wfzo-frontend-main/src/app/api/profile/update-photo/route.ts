import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001'
).replace(/\/$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { memberId, userEmail, photoUrl } = body;

    if (!memberId || !userEmail || !photoUrl) {
      return NextResponse.json(
        { message: 'Missing required fields: memberId, userEmail, or photoUrl' },
        { status: 400 }
      );
    }

    // First, fetch current member data to get the full userSnapshots array
    const getMemberUrl = `${API_BASE_URL}/wfzo/api/v1/member/me`;
    const getMemberResponse = await fetch(getMemberUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail }),
    });

    if (!getMemberResponse.ok) {
      const errorText = await getMemberResponse.text();
      return NextResponse.json(
        { message: 'Failed to fetch current member data', details: errorText },
        { status: getMemberResponse.status }
      );
    }

    const memberData = await getMemberResponse.json();

    // Update the userSnapshots array with the new photoUrl
    const updatedUserSnapshots = memberData.userSnapshots?.map((snapshot: any) =>
      snapshot.email === userEmail
        ? { ...snapshot, photoUrl }
        : snapshot
    ) || [];

    // Prepare the update payload
    const updatePayload = {
      ...memberData,
      userSnapshots: updatedUserSnapshots,
    };

    // Update the member data
    const updateUrl = `${API_BASE_URL}/wfzo/api/v1/member/save/${encodeURIComponent(memberId)}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      return NextResponse.json(
        { message: 'Failed to update profile photo', details: errorText },
        { status: updateResponse.status }
      );
    }

    const result = await updateResponse.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error updating profile photo:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
