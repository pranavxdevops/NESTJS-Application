'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { search } from '@/services/searchService';
import type { SearchResponse, SearchHit } from 'types/search';
import Image from 'next/image';
import Hero from '@/features/about/components/Hero';
import { CATEGORY_COLORS, CATEGORY_ICONS, DEFAULT_SEARCH_PAGE_SIZE } from '@/lib/constants/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/Select';
import { getCurrentLocale, normalizeUrlWithLocale } from '@/lib/utils/routing';

export default function SearchPage() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const initialCategory = params.get('category') || '';
  const initialDateRange = (params.get('dateRange') || 'all') as
    | 'all'
    | '1m'
    | '3m'
    | '6m'
    | '1y'
    | 'older';
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current locale from pathname (e.g., /en/search -> en)
  const currentLocale = useMemo(() => getCurrentLocale(pathname), [pathname]);
  const [data, setData] = useState<SearchResponse | null>(null);
  // removed separate loading state to avoid flicker; using fetchingMore for pagination state
  const [category, setCategory] = useState<string>(initialCategory);
  const [dateRange, setDateRange] = useState<typeof initialDateRange>(initialDateRange);
  const [items, setItems] = useState<SearchResponse['data']['hits']>([]);
  const [offset, setOffset] = useState(0);
  const pageSize = parseInt(process.env.NEXT_PUBLIC_SEARCH_PAGE_SIZE || String(DEFAULT_SEARCH_PAGE_SIZE), 10);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const isPagingRef = useRef(false);
  // dynamic sticky top offset to sit just below the current nav height (works for both solid and glass states)
  const [stickyTop, setStickyTop] = useState<number>(80);
  // measure sticky search header bar height to create a comfortable gap for the left Facets sticky
  const [headingHeight, setHeadingHeight] = useState<number>(0);
  const searchHeaderRef = useRef<HTMLDivElement | null>(null);
  const resultsTopRef = useRef<HTMLDivElement | null>(null);

  const scrollToResultsTop = () => {
    if (typeof window === 'undefined') return;
    const anchor = resultsTopRef.current;
    const offset = stickyTop + headingHeight + 8; // small breathing room under sticky bars
    const target = anchor ? anchor.getBoundingClientRect().top + window.scrollY - offset : 0;
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  };

  // Measure header/nav height and keep sticky sections below it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const headerEl = document.querySelector('header');

    const compute = () => {
      const h = (headerEl as HTMLElement | null)?.getBoundingClientRect().height || 80;
      setStickyTop(h);
      const hh = searchHeaderRef.current?.getBoundingClientRect().height || 0;
      setHeadingHeight(hh);
    };

    compute();

    let ro: ResizeObserver | undefined;
    let mo: MutationObserver | undefined;
    const extraObservers: ResizeObserver[] = [];
    if (headerEl) {
      ro = new ResizeObserver(() => compute());
      ro.observe(headerEl as Element);
      mo = new MutationObserver(() => compute());
      mo.observe(headerEl as Element, { attributes: true, childList: true, subtree: true });
    }
    if (searchHeaderRef.current) {
      const ro2 = new ResizeObserver(() => compute());
      ro2.observe(searchHeaderRef.current);
      extraObservers.push(ro2);
    }
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('resize', compute);
      // disconnect main and any child observers
      if (ro) {
        ro.disconnect();
      }
      extraObservers.forEach((o) => o.disconnect());
      mo?.disconnect();
    };
  }, []);

  const updateUrl = (updates: Record<string, string>) => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    Object.entries(updates).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    router.replace(`${pathname}?${sp.toString()}`);
  };

  // Initial fetch (and when query changes) – reset list and fetch first page
  useEffect(() => {
    if (!q) return;
    setItems([]);
    setOffset(0);
    setHasMore(true);
    isPagingRef.current = false;
    search({
      query: q,
      limit: pageSize,
      offset: 0,
      // searchType is now controlled by API ENV variable
    })
      .then((res) => {
        setData(res);
        setItems(res.data.hits);
        setTotal(res.data.found || 0);
        setHasMore(res.data.hits.length < (res.data.found || 0));
      })
      .finally(() => {});
  }, [q]);

  // Infinite load (append next pages)
  useEffect(() => {
    if (!q || offset === 0) return; // first page handled above
    let cancelled = false;
    setFetchingMore(true);
    search({
      query: q,
      limit: pageSize,
      offset,
      // searchType is now controlled by API ENV variable
    })
      .then((res) => {
        console.log('got page', offset, res);
        if (cancelled) return;
        setItems((prev) => {
          const next = [...prev, ...res.data.hits];
          const found = res.data.found || total || 0;
          setHasMore(next.length < found);
          return next;
        });
      })
      .finally(() => {
        setFetchingMore(false);
        isPagingRef.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [offset, q, total]);
  // Client-side filtering helpers
  const getHitDate = (h: SearchHit): Date | null => {
    const raw = h.publishedDate;
    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const visibleHits = useMemo(() => {
    let filtered: SearchHit[] = items as SearchHit[];
    if (category) {
      filtered = filtered.filter((h: SearchHit) => String(h.category || '').toLowerCase() === String(category).toLowerCase());
    }
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let threshold: Date | null = null;
      const subMonths = (m: number) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - m);
        return d;
      };
      switch (dateRange) {
        case '1m':
          threshold = subMonths(1);
          break;
        case '3m':
          threshold = subMonths(3);
          break;
        case '6m':
          threshold = subMonths(6);
          break;
        case '1y': {
          const d = new Date(now);
          d.setFullYear(d.getFullYear() - 1);
          threshold = d;
          break;
        }
        case 'older':
          threshold = null; // handled separately
          break;
      }
      filtered = filtered.filter((h: SearchHit) => {
        const hd = getHitDate(h);
        if (!hd) return false; // if no date, exclude from date-based filters
        if (dateRange === 'older') {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          return hd < oneYearAgo;
        }
        return threshold ? hd >= threshold : true;
      });
    }
    return filtered;
  }, [items, category, dateRange]);

  // Helper to parse tags with pattern: url:/some/path|name:Readable Label
  const parseTagLinks = (tags?: string[]): { href: string; label: string }[] => {
    if (!tags) return [];
    return tags
      .map((t) => {
        if (!t.startsWith('url:')) return null;
        const parts = t.split('|');
        const urlPart = parts.find((p) => p.startsWith('url:'));
        const namePart = parts.find((p) => p.startsWith('name:'));
        if (!urlPart) return null;
        const rawHref = urlPart.replace(/^url:/, '').trim();
        const label = namePart ? namePart.replace(/^name:/, '').trim() : rawHref;
        if (!rawHref) return null;
        
        // Normalize URL to include locale prefix for internal routes
        const href = normalizeUrlWithLocale(rawHref, currentLocale);
        return { href, label };
      })
      .filter(Boolean) as { href: string; label: string }[];
  };

  return (
    <div>
      <Hero />
      <div className="px-5 md:px-30 py-10 md:py-20">
        <section className="">
          {/* Page heading (sticky, full-viewport glass background) */}
          <div className="sticky z-30 mb-6" style={{ top: stickyTop }}>
            {/* This inner bar stretches to full viewport width while content stays centered */}
            <div
              ref={searchHeaderRef}
              className="relative left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-zinc-200"
            >
              <div className="py-3">
                <h1 className="text-[28px] leading-8 font-extrabold text-[#1C1C1C]">
                  Results for &ldquo;{q}&rdquo;
                </h1>
                <p className="text-sm text-[#6F6F6F] mt-1">
                  Showing {visibleHits.length} of {data?.data.found || 0} results
                </p>
              </div>
            </div>
          </div>

          {
            <>
              {/* invisible anchor to scroll results to below sticky bars */}
              <div ref={resultsTopRef} />
              <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
                {/* Facets */}
                {/* add extra spacing so the sticky Facets isn't glued to the sticky heading */}
                <aside
                  className="md:sticky self-start"
                  style={{ top: stickyTop + headingHeight + 12 }}
                >
                  <div className="mb-6">
                    <h3 className="font-bold text-base text-[#1C1C1C] mb-2">Filter by category</h3>
                    <Select
                      value={category}
                      onValueChange={(val) => {
                        setCategory(val);
                        updateUrl({ category: val });
                        scrollToResultsTop();
                      }}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-neutral-grey-300 font-source">
                        <SelectValue placeholder="Select Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        {data?.data.facet_counts
                          .find((f) => f.field_name === 'category')
                          ?.counts.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.value}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1C1C1C] mb-2">Filter by date</h3>
                    <ul className="space-y-2 text-sm text-zinc-700">
                      {[
                        { key: 'all', label: 'All' },
                        { key: '1m', label: 'Past month' },
                        { key: '3m', label: 'Past 3 months' },
                        { key: '6m', label: 'Past 6 months' },
                        { key: '1y', label: 'Past year' },
                        { key: 'older', label: 'Older than a year' },
                      ].map((d) => (
                        <li key={d.key}>
                          <button
                            type="button"
                            className={`flex items-center gap-2 ${dateRange === d.key ? 'text-wfzo-gold-700 font-semibold' : ''}`}
                            onClick={() => {
                              setDateRange(d.key as 'all' | '1m' | '3m' | '6m' | '1y' | 'older');
                              updateUrl({ dateRange: d.key });
                              scrollToResultsTop();
                            }}
                          >
                            <span
                              className={`inline-block w-3 h-3 rounded-full border ${dateRange === d.key ? 'bg-wfzo-gold-600 border-wfzo-gold-600' : 'border-zinc-400'}`}
                            />
                            {d.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-4 text-sm text-wfzo-gold-700"
                      onClick={() => {
                        setCategory('');
                        setDateRange('all');
                        updateUrl({ category: '', dateRange: 'all' });
                        scrollToResultsTop();
                      }}
                    >
                      Reset filters
                    </button>
                  </div>
                </aside>

                {/* Results */}
                <div className="space-y-6">
                  {visibleHits.length === 0 ? (
                    <div className="py-16 text-center text-zinc-600 border border-zinc-200 rounded-xl">
                      No results found
                    </div>
                  ) : (
                  <ul className="divide-y divide-zinc-200">
                    {visibleHits.map((h) => {
                      const tagLinks = parseTagLinks(h.tags as string[] | undefined);
                      const primaryHref = tagLinks[0]?.href;
                      return (
                        <li key={h.id} className="py-6">
                          {primaryHref ? (
                            <a href={primaryHref} className="block group">
                              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 cursor-pointer">
                          {/* <div className="w-full md:w-[200px] h-[180px] md:h-[120px] rounded-xl bg-zinc-100 mb-2 md:mb-0" />*/}
                          <div className="w-full lg:w-[200px] h-[180px] lg:h-[120px] rounded-xl bg-zinc-100 mb-2 lg:mb-0 relative overflow-hidden">
                            <Image
                              src={'/dummy_search-image.png'}
                              alt={h.title || 'Search result image'}
                              fill
                              sizes="(max-width: 1024px) 90vw, 200px"
                              className="object-cover object-center"
                              priority={false}
                            />
                          </div>

                          <div className="flex-1">
                            <div className="mb-2">
                              {/* Category chip with icon & colors reused from NewsCard */}
                              {h.category && (
                                <span
                                  className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-xl mr-2"
                                  style={{
                                    backgroundColor:
                                      CATEGORY_COLORS[h.category]?.background || '#F4F4F4',
                                    color: CATEGORY_COLORS[h.category]?.text || '#333333',
                                  }}
                                >
                                  <Image
                                    src={CATEGORY_ICONS[h.category] || '/file.svg'}
                                    alt="category icon"
                                    width={14}
                                    height={14}
                                  />
                                  <span className="font-medium">{h.category}</span>
                                </span>
                              )}
                            </div>
                            <h3 className="text-base leading-6 font-extrabold text-[#1C1C1C] mb-1 group-hover:underline">
                              {h.title}
                            </h3>
                            {(h.author || h.organization) && (
                              <div className="mb-1">
                                {h.author && (
                                  <p className="text-[12px] leading-4 font-bold text-[#4D4D4D]">
                                    {h.author}
                                  </p>
                                )}
                                {h.organization && (
                                  <p className="text-[12px] leading-4 text-[#4D4D4D]">
                                    {h.organization}
                                  </p>
                                )}
                              </div>
                            )}
                            <p
                              className="text-zinc-700 text-sm"
                              dangerouslySetInnerHTML={{ __html: h.snippet || '' }}
                            />
                            {/* Removed action chips; entire item is clickable */}
                          </div>
                            </div>
                            </a>
                          ) : (
                            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                              <div className="w-full lg:w-[200px] h-[180px] lg:h-[120px] rounded-xl bg-zinc-100 mb-2 lg:mb-0 relative overflow-hidden">
                                <Image
                                  src={'/dummy_search-image.png'}
                                  alt={h.title || 'Search result image'}
                                  fill
                                  sizes="(max-width: 1024px) 90vw, 200px"
                                  className="object-cover object-center"
                                  priority={false}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="mb-2">
                                  {h.category && (
                                    <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-xl mr-2" style={{
                                      backgroundColor: CATEGORY_COLORS[h.category]?.background || '#F4F4F4',
                                      color: CATEGORY_COLORS[h.category]?.text || '#333333',
                                    }}>
                                      <Image src={CATEGORY_ICONS[h.category] || '/file.svg'} alt="category icon" width={14} height={14} />
                                      <span className="font-medium">{h.category}</span>
                                    </span>
                                  )}
                                </div>
                                <h3 className="text-base leading-6 font-extrabold text-[#1C1C1C] mb-1">{h.title}</h3>
                                {(h.author || h.organization) && (
                                  <div className="mb-1">
                                    {h.author && (<p className="text-[12px] leading-4 font-bold text-[#4D4D4D]">{h.author}</p>)}
                                    {h.organization && (<p className="text-[12px] leading-4 text-[#4D4D4D]">{h.organization}</p>)}
                                  </div>
                                )}
                                <p className="text-zinc-700 text-sm" dangerouslySetInnerHTML={{ __html: h.snippet || '' }} />
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  )}
                  {/* Sentinel for lazy loading */}
                  {hasMore && (
                    <IntersectionSentinel
                      onVisible={() => {
                        if (isPagingRef.current || fetchingMore || !hasMore) return;
                        isPagingRef.current = true;
                        setOffset((prev) => prev + pageSize);
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          }
        </section>
      </div>
    </div>
  );
}

// Simple intersection observer component to trigger pagination
function IntersectionSentinel({ onVisible }: { onVisible: () => void }) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const enteredRef = useRef(false);
  useEffect(() => {
    if (!ref) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (!enteredRef.current) {
              enteredRef.current = true;
              onVisible();
            }
          } else {
            enteredRef.current = false;
          }
        });
      },
      { rootMargin: '150px' }
    );
    io.observe(ref);
    return () => io.disconnect();
  }, [ref, onVisible]);
  return <div ref={setRef} className="h-6" />;
}
