import { transformCTA } from "./transformHomepage";

export function transformNavigation(json) {
  if (!json?.data) return null;


  function buildUrl(item, parentPath = "") {
    // If fullPath exists 
    if(item.internalLink?.fullPath){
      return item.internalLink.fullPath;
    }
    // For internal links, prefer slug path
    if (item.internalLink?.slug) {
      return `${parentPath}/${item.internalLink.slug}`;
    }

    // For external links
    if (item.externalUrl) {
      return item.externalUrl;
    }

    // If href present (like logo, cta, etc.)
    if (item.href) {
      return item.href; 
    }
    //Where is the anchor link? 

    return null;
  }

  // Common placeholder page for not-yet-implemented routes (under construction)
  const UNDER_CONSTRUCTION_PATH = '/under-construction';
  const NOT_IMPLEMENTED_LABELS = new Set([
    
  ]);

  function transformItems(items, parentPath = "") {
    return items.map((item) => {
      const label = item.label || item.internalLink?.title || null;
      const generatedUrl = buildUrl(item, parentPath);
      // If the label is in the not-implemented list, override to under construction page
      let finalUrl = label && NOT_IMPLEMENTED_LABELS.has(label) ? UNDER_CONSTRUCTION_PATH : generatedUrl;
      
      // Ensure finalUrl is never null - use '#' as fallback for items without valid URLs
      if (!finalUrl || finalUrl === null || finalUrl === '') {
        finalUrl = '#';
      }
      
      // Special handling: News & Publications uses `news_pages` instead of `internalLink`/`children`
      if (Array.isArray(item.news_pages) && item.news_pages.length > 0) {
        // All news sub-pages navigate to the same page with a category query param
        const baseQueryPath = '/news-publications';
        const newsChildren = item.news_pages.map((page) => {
          const childLabel = page?.title || null;
          let childUrl = page?.slug
            ? `${baseQueryPath}?category=${encodeURIComponent(page.slug)}`
            : null;
          // Ensure child URL is never null
          if (!childUrl || childUrl === null || childUrl === '') {
            childUrl = '#';
          }
          return {
            label: childLabel,
            url: childUrl,
            children: undefined,
          };
        });

        return {
          label,
          url: finalUrl || baseQueryPath, // parent opens All tab by default
          children: newsChildren,
        };
      }

      return {
        label,
        url: finalUrl,
        children: item.children?.length
          ? transformItems(item.children, finalUrl || parentPath)
          : undefined,
      };
    });
  }

  return {
    locale: json.data.locale || "en",
    logo: json.data.logo || null,
    cta: transformCTA(json.data.Cta) || null,
    version: json.data.updatedAt || null, // or use createdAt if needed
    profile: json.data.Profile || null,
    search: json.data.Search || null,
    items: transformItems(json.data.items || []),
  };
}
 