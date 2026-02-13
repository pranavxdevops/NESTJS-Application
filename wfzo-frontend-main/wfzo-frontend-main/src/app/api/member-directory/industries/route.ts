import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/').replace(/\/$/, '');
const DROPDOWN_PATH = '/wfzo/api/v1/masterdata/dropdowns/category';
const DEFAULT_LOCALE = 'en';

export const dynamic = 'force-dynamic'; // Prevent static generation

interface DropdownValue {
  category: string;
  code: string;
  label: string;
  displayOrder: number;
}

interface FilterOption {
  id: string | number;
  name: string;
  isActive?: boolean;
}

interface DropdownResponse {
  category: string;
  locale: string;
  values: DropdownValue[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || DEFAULT_LOCALE;

  const targetUrl = `${API_BASE_URL}${DROPDOWN_PATH}/industries?locale=${encodeURIComponent(locale)}`;

  // Generate the API key
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: 'API_KEY environment variable is not set' }, { status: 500 });
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned status ${response.status}`);
    }

    const data = (await response.json()) as DropdownResponse;

    // Convert DropdownValue to FilterOption format
    const filterOptions: FilterOption[] = (data.values || [])
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((value: DropdownValue) => ({
        id: value.code,
        name: value.label,
        isActive: true, // All dropdown values are active
      }));

    return NextResponse.json(filterOptions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load industries';
    console.error('Error fetching industries:', message);
    return NextResponse.json({ message }, { status: 500 });
  }
}
