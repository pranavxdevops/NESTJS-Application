export type SearchRequest = {
  query: string;
  // searchType is now controlled by API ENV variable, not frontend
  limit?: number;
  offset?: number;
  //category?: string | 'News Letter';
  tags?: string[];
  //dateRange?: 'all' | '1m' | '3m' | '6m' | '1y' | 'older';
};

export type SearchHit = {
  id: string;
  title: string;
  content?: string;
  category?: string;
  tags?: string[];
  score?: number;
  snippet?: string;
  author?: string;
  organization?: string;
  publishedDate?: string;
  url?: string;
};

export type FacetCount = {
  counts: Array<{
    count: number;
    value: string;
    highlighted?: string;
  }>;
  field_name: string;
  sampled?: boolean;
  stats?: {
    total_values: number;
  };
};

export type SearchResponse = {
  success: boolean;
  data: {
    hits: SearchHit[];
    found: number;
    search_time_ms: number;
    facet_counts: FacetCount[];
  };
};
