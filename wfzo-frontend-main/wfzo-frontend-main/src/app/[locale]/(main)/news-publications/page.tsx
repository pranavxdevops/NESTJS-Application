import Hero from '@/features/about/components/Hero';
import BreadcrumbContentHeader from '@/shared/components/BreadcrumbContentHeader';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ExploreCard from '@/shared/components/ExploreCard';
import ContactSection from '@/shared/components/ContactSection';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import NewsCategoriesTabs, { YourArticle, Tab } from '@/features/news/components/NewsCategoriesTabs';
// NewsCard is used inside the client-side FeaturedNewsCarousel
import FeaturedNewsCarousel from '@/features/news/components/FeaturedNewsCarousel';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { EcosystemCard, ImageType } from '@/shared/types/globals';
import { formatFeaturedNews, getFeaturedNews } from '@/lib/news';

// NormalizedFeatured type is used inside FeaturedNewsCarousel



interface PageSearchParams {
  category?: string;
}

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

export default async function NewsPublicationsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { category } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_API_BASE_URL is not configured');
  }

  const pageUrl = `${baseUrl}/api/pages?filters[slug][$eq]=news-publications&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][cta][populate]=*`;
    const tabsUrl = `${baseUrl}/api/tabs`;
    const articlesUrl = `${baseUrl}/api/articles?populate=*`;
    const featuredUrl = `${baseUrl}/api/articles?filters[isFeatured][$eq]=true&populate[event_details][populate][image][populate][image][fields][0]=url`; // Assume there's an endpoint for featured news

  const [pageJson, tabsJson, articlesJson, featuredJson] = await Promise.all([
    fetchJson(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
    fetchJson(tabsUrl, { next: { revalidate: 3600, tags: ['/api/tabs'] } }),
    fetchJson(articlesUrl, { next: { revalidate: 3600, tags: ['/api/articles'] } }),
    fetchJson(featuredUrl, { next: { revalidate: 3600, tags: ['/api/featured-news'] } }),
  ]);
  function getTitleBySlug(
  items: { slug: string; title: string }[],
  slug: string
): string | undefined {
  return items.find(item => item.slug === slug)?.title;
}

  const sections = { ...pageJson.data[0], featuredNews: featuredJson.data || [] };
  const tabs: Tab[] = tabsJson.data || [];
  const activeTab = getTitleBySlug(tabs, category || '') || 'All';
  const articles: YourArticle[] = (articlesJson.data || []).map((item: any, index: number) => {
    const imageUrl = item.newsImage?.url ? getStrapiMediaUrl(item.newsImage.url) : '';
    const title = item.title || item.attributes?.title || 'Untitled Article';
    const organization = item.organizationName || item.attributes?.organizationName || '';
    const category = typeof item.articleCategory === 'object' ? item.articleCategory?.title : item.articleCategory || item.category?.title || '';
    const description = item.shortDescription || item.attributes?.shortDescription || '';
    const date = item.updatedAt || item.attributes?.updatedAt ? new Date(item.updatedAt || item.attributes?.updatedAt).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) : '';
    const status = (item.newsStatus || item.attributes?.newsStatus || 'published').toLowerCase();
    const articleFormat = item.articleFormat || item.attributes?.articleFormat;
    const type = articleFormat === 'pdf' ? 'document' : 'article';
    const document = item.pdfFile?.url || item.attributes?.pdfFile?.url ? getStrapiMediaUrl(item.pdfFile?.url || item.attributes?.pdfFile?.url) : undefined;

    return {
      id: String(item.documentId || item.slug || item.id || `article-${index}`),
      title,
      organization,
      date,
      description,
      imageUrl,
      articleData: item,
      status,
      category,
      type,
      document,
      slug: item.slug,
    };
  });
  

  const breadcrumbItems = buildBreadcrumbs(sections.fullPath, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: 'News & Publications',
  });

  const ecosystemCards = sections.ecosystem?.cards ?? [];


  const featuredNews = await getFeaturedNews();
  const filteredFeaturedNews = formatFeaturedNews(featuredNews);

  return (
    <div>
      <Hero imageUrl={sections.hero?.heroImage ?? undefined} />

      <div>
        <BreadcrumbContentHeader
          breadcrumbItems={breadcrumbItems}
          contentHeaderProps={{
            header: sections.hero?.title ?? sections.title ?? '',
            description: sections.hero?.description ?? '',
            showExploreAll: false,
            exploreAllHref: '/',
          }}
          containerClassName=""
        />

        {/* Featured Publications Carousel */}
        <div className='px-5 md:px-30'>
        {filteredFeaturedNews.length > 0 && <FeaturedNewsCarousel items={filteredFeaturedNews} />}

        <NewsCategoriesTabs articles={articles} tabs={tabs} activeTab={activeTab} items={3}/>
        </div>
        {ecosystemCards.length > 0 && (
          <AdvancedCarousel
            itemsCount={ecosystemCards.length}
            title={sections.ecosystem?.title}
            description={sections.ecosystem?.description}
            pageHeading={false}
            visibleSlides={{
              xs: 1.2,
              sm: 2,
              md: 2,
              lg: 3,
              xl: 3,
            }}
            slidesToScroll={1}
            autoplay
            autoplayDelay={5000}
            loop
            showControls
            showProgressBar
            gap={16}
          >
            {ecosystemCards.map((card: EcosystemCard, index: number) => (
              <div key={index} className="h-full mb-6">
                  <ExploreCard 
                          image={
                           card?.backgroundImage?.formats?.medium
                           ? getStrapiMediaUrl(card.backgroundImage.formats.medium)
                           : card?.backgroundImage?.url
                           ? getStrapiMediaUrl(card.backgroundImage.url)
                            : FALLBACK_IMAGE
                            }  
                           title={card.title} 
                           link={card.link} 
                       />
              </div>
            ))}
          </AdvancedCarousel>
        )}
      </div>

      {sections.contactUs && (
        <ContactSection
          title={sections.contactUs.title}
          description={sections.contactUs.description}
          backgroundImage={{ url: sections.contactUs.backgroundImage ?? undefined }}
          cta={sections.contactUs.cta??undefined}
        />
      )}
    </div>
  );
}
