import { SearchRequest, SearchResponse } from 'types/search';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/';

export async function search(content: SearchRequest): Promise<SearchResponse> {
  const safeDefaultResponse: SearchResponse = {
    success: false,
    data: {
      hits: [],
      found: 0,
      search_time_ms: 0,
      facet_counts: [],
    },
  };

  try {
    const searchUrl = `${API_BASE_URL}wfzo/api/v1/search`;
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    
    if (!res.ok) {
      try {
        const errorText = await res.text();
        console.error('Search API error:', res.status, res.statusText, errorText);
      } catch (textError) {
        console.error('Search API error:', res.status, res.statusText, '(Failed to read error text)');
      }
      return safeDefaultResponse;
    }
    
    let apiResponse: any;
    try {
      apiResponse = await res.json();
    } catch (jsonError) {
      console.error('Failed to parse search API response as JSON:', jsonError);
      return safeDefaultResponse;
    }
    
    // Transform API response to match frontend expected structure
    // API returns: { hits, found, search_time_ms, facet_counts, search_type_used }
    // Frontend expects: { success, data: { hits, found, search_time_ms, facet_counts } }
    if (apiResponse && Array.isArray(apiResponse.hits)) {
      return {
        success: true,
        data: {
          hits: apiResponse.hits || [],
          found: apiResponse.found || 0,
          search_time_ms: apiResponse.search_time_ms || 0,
          facet_counts: apiResponse.facet_counts || [],
        },
      };
    }
    
    // If response structure is unexpected, return safe default
    console.error('Unexpected search response structure:', apiResponse);
    return safeDefaultResponse;
  } catch (error) {
    // Handle network errors, fetch failures, or any other unexpected errors
    console.error('Search service error:', error);
    return safeDefaultResponse;
  }
}
