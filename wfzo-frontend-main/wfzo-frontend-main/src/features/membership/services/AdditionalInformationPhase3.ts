export async function savePhase3Draft(
  memberId: string,
  payload: Record<string, unknown>
) {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  const response = await fetch(

    `${API_BASE}wfzo/api/v1/member/${memberId}/additional-info/draft`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to save additional info');
  }

  return response.json();
}


export async function submitPhase3Application(
  memberId: string,
  payload: any
) {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  const response = await fetch(
    `${API_BASE}wfzo/api/v1/member/${memberId}/additional-info/submit`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        accept: '*/*',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to submit application');
  }

  return response.json();
}

export async function fetchPhase3Info(memberId: string) {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
  const response = await fetch(
    `${API_BASE}wfzo/api/v1/member/${memberId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch member data');
  }

  const data = await response.json();
  return data.additionalInfo ?? null;
}

