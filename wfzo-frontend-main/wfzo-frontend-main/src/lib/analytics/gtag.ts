export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
  ...otherParams
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...otherParams,
    });
  }
};

// Specific event helpers
export const trackArticleRead = (articleId: string, articleTitle: string, category?: string) => {
  event({
    action: 'article_read',
    category: 'Content',
    label: articleTitle,
    article_id: articleId,
    article_title: articleTitle,
    article_category: category,
  });
};

export const trackMemberSearch = (query: string, resultCount: number) => {
  event({
    action: 'member_search',
    category: 'Search',
    label: query,
    value: resultCount,
    search_term: query,
    results_count: resultCount,
  });
};

export const trackMemberView = (memberId: string, memberName: string, organization: string) => {
  event({
    action: 'member_view',
    category: 'Members',
    label: memberName,
    member_id: memberId,
    member_name: memberName,
    organization: organization,
  });
};

export const trackEventView = (eventId: string, eventTitle: string, eventType?: string) => {
  event({
    action: 'event_view',
    category: 'Events',
    label: eventTitle,
    event_id: eventId,
    event_title: eventTitle,
    event_type: eventType,
  });
};

export const trackDownload = (documentId: string, documentTitle: string, documentType: string) => {
  event({
    action: 'file_download',
    category: 'Downloads',
    label: documentTitle,
    document_id: documentId,
    document_type: documentType,
  });
};

export const trackVideoPlay = (videoId: string, videoTitle: string) => {
  event({
    action: 'video_play',
    category: 'Videos',
    label: videoTitle,
    video_id: videoId,
  });
};

// Set user properties for logged-in users
export const setUserProperties = (userId: string, memberId?: string, memberType?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', {
      user_id: userId,
      member_id: memberId,
      member_type: memberType,
      user_type: userId ? 'authenticated' : 'guest',
    });
  }
};
