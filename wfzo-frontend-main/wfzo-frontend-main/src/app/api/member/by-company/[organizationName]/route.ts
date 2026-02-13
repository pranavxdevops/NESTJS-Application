import {  NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }:  { params: Promise<{ organizationName: string }> }
) {

function mask(value: string | undefined, length: number) {
  if (!value) return '*'.repeat(length);
  return '*'.repeat(length);
}



 const { organizationName } = await params;
  const { searchParams } = new URL(request.url);
  const isMemberParam = searchParams.get('member');

  const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}wfzo/api/v1/member/by-company/${organizationName}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: response.status });
    }

    const data = await response.json();

    // Check if user is authorized member
    // For testing, use query param ?member=true/false
    // Otherwise, check Authorization header
    let isMember = false;
    if (isMemberParam === 'true') {
      isMember = true;
    } else if (isMemberParam === 'false') {
      isMember = false;
    } else {
      const authHeader = request.headers.get('authorization');
      isMember = !!authHeader; // Simple check, replace with proper auth logic
    }
console.log(data);
if (isMember) {
  return NextResponse.json({
    ...data,
    isMember: true, 
  });
} else {
      // Return only company name, industries, and country name
      const filteredData = {
         isMember: false,
        organisationInfo: {
          companyName: data.organisationInfo?.companyName,
          industries: data.organisationInfo?.industries,
          memberLogoUrl:data.organisationInfo?.memberLogoUrl,
            websiteUrl: mask(data.organisationInfo?.websiteUrl, 10),

    position: data.organisationInfo?.position,
    
    
          address: {
            country: data.organisationInfo?.address?.country,
             city: mask(data.organisationInfo?.address?.city, 10),
              line1: mask(data.organisationInfo?.address?.line1, 16),
      line2: mask(data.organisationInfo?.address?.line2, 16),
          },
           
        },
         userSnapshots: Array.isArray(data.userSnapshots)
  ? data.userSnapshots.map((user: any) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      designation:
        user.designation ||
        (user.userType === 'Primary'
          ? 'Primary Contact'
          : 'Team Member'),
      profileImageUrl: user.profileImageUrl,
       email: mask(data.userSnapshots?.[0]?.email, 14),
      contactNumber: mask(data.userSnapshots?.[0]?.contactNumber, 10),
      // ❌ email & phone intentionally not sent for guests
    }))
  : [],
  
      };

      console.log(filteredData);
      
      return NextResponse.json(filteredData);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}