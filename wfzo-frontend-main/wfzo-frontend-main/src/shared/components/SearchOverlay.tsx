"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { search } from '@/services/searchService';
import type { SearchResponse } from 'types/search';
import { DEFAULT_SEARCH_PAGE_SIZE } from '@/lib/constants/constants';
import GoldButton from './GoldButton';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onResults: (res: SearchResponse) => void;
  onSubmit?: (query: string) => void;
};

export default function SearchOverlay({ isOpen, onClose, onResults, onSubmit }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [chips] = useState<string[]>([
    'News' , 'Articles', 'Membership', 'Congress'
  ]);

  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const doSearch = async () => {
    setLoading(true);
    try {
      if (onSubmit) {
        onSubmit(query);
      } else {
        // NO-OP PATH: This code path is never executed in the current implementation.
        // SearchOverlay is always used with onSubmit provided (from NavigationMenu),
        // which redirects to /search page instead of calling the API here.
        // Even if this path were executed:
        // - This component has no UI for displaying search results anyway
        // - onResults callback which is invoked with results, is an empty function (() => {})
        // TODO: Should remove this code-path after confirming requirement (or implement the UI))
        // -
        const pageSize = parseInt(process.env.NEXT_PUBLIC_SEARCH_PAGE_SIZE || String(DEFAULT_SEARCH_PAGE_SIZE), 10);
        const res = await search({ query, limit: pageSize });
        onResults(res);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-1 z-[400] bg-black/60 backdrop-blur-sm flex items-start justify-center">
      <div className="mt-30 md:mt-32 lg:mt-36 w-[92%] max-w-5xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3 pb-3 mb-4 border-b border-zinc-200">
          <Image src="/assets/search.svg" alt="Search" width={20} height={20} className="opacity-60" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder="Search"
            className="w-full outline-none placeholder:text-zinc-400 text-zinc-700"
          />
          <GoldButton
            onClick={doSearch}
            disabled={loading}
          >
            {loading ? 'Searching…' : 'Search'}
          </GoldButton>
          <button aria-label="Close" className="p-2" onClick={onClose}>
            <span className="text-2xl">×</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setQuery(c)}
              className="inline-flex items-center rounded-xl px-3 py-2 text-sm bg-white border border-zinc-200 shadow-sm text-zinc-700 hover:bg-zinc-50"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
