'use client';

import { useEffect } from 'react';
import { trackArticleRead } from '@/lib/analytics/gtag';

export function ArticleTracker({ 
  articleId, 
  articleTitle,
  category 
}: { 
  articleId: string; 
  articleTitle: string;
  category?: string;
}) {
  useEffect(() => {
    if (articleId && articleTitle) {
      trackArticleRead(articleId, articleTitle, category);
    }
  }, [articleId, articleTitle, category]);

  return null;
}
