import { NextRequest, NextResponse } from 'next/server';

//Temporary mock search API until we have a real search backend
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { query = '', limit = 10, offset = 0, category, tags, dateRange = 'all' } = body || {};

  const now = new Date();
  // Build a larger pool, then slice by offset/limit
  const poolSize = 60;
  const categories = ['Library', 'News Releases', 'Newsletter'];
  const sampleAll = Array.from({ length: poolSize }).map((_, i) => {
    const id = `${i + 1}`.padStart(8, '0');
    return {
      id,
      title: `Sample Result ${i + 1} for "${query}"`,
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed tristique augue in diam aliquam, non luctus ipsum fermentum.',
      category: categories[i % categories.length],
      tags: tags || ['AI', 'ML', 'education'].slice(0, 2),
      score: Math.random() * 10,
      snippet: `<mark>${query || 'Sample'}</mark> is found within this content snippet...`,
      author: 'World Free Zones Organization',
      organization: 'WFZO',
      publishedDate: new Date(now.getTime() - i * 86400000).toISOString(),
      url: '/news',
    };
  });

  // Filter by dateRange
  const filteredByDate = sampleAll.filter((item) => {
    const d = item.publishedDate ? new Date(item.publishedDate) : new Date();
    const days = (Date.now() - d.getTime()) / 86400000;
    switch (dateRange) {
      case '1m':
        return days <= 30;
      case '3m':
        return days <= 90;
      case '6m':
        return days <= 180;
      case '1y':
        return days <= 365;
      case 'older':
        return days > 365;
      default:
        return true;
    }
  });

  const filtered = filteredByDate.filter((s) => (category ? s.category === category : true));
  const sample = filtered.slice(Number(offset) || 0, (Number(offset) || 0) + (Number(limit) || 10));

  // Build dynamic facet counts from filtered set (ignoring offset)
  const categoryCounts = categories.map((c) => ({
    count: filtered.filter((x) => x.category === c).length,
    value: c,
  }));
  const tagValues = ['AI', 'ML', 'education'];
  const tagCounts = tagValues.map((t) => ({
    count: filtered.filter((x) => (x.tags || []).includes(t)).length,
    value: t,
  }));

  const res = {
    success: true,
    data: {
      hits: sample,
      found: filtered.length,
      search_time_ms: 12,
      facet_counts: [
        {
          field_name: 'category',
          sampled: false,
          counts: categoryCounts,
          stats: { total_values: categoryCounts.length },
        },
        {
          field_name: 'tags',
          sampled: false,
          counts: tagCounts,
          stats: { total_values: tagCounts.length },
        },
      ],
    },
  };

  return NextResponse.json(res);
}
