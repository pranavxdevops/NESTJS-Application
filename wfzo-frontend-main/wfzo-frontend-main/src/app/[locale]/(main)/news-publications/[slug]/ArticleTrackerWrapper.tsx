'use client';

import { ArticleTracker } from '@/shared/components/tracking/ArticleTracker';

interface ArticleTrackerWrapperProps {
  articleId: string;
  articleTitle: string;
  category?: string;
}

export function ArticleTrackerWrapper({ 
  articleId, 
  articleTitle, 
  category 
}: ArticleTrackerWrapperProps) {
  return (
    <ArticleTracker 
      articleId={articleId} 
      articleTitle={articleTitle} 
      category={category} 
    />
  );
}
