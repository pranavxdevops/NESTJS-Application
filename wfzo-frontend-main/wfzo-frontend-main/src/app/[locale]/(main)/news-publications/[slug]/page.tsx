import { Breadcrumb, BreadcrumbItem } from '@/shared/components/Breadcrumb';
import GoldButton from '@/shared/components/GoldButton';
import ContentSection from '@/shared/components/ContentSection';
import { ArrowLeft } from 'lucide-react';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import Link from 'next/link';
import Hero from '@/features/about/components/Hero';
import { parseRichText } from '@/lib/utils/renderRichText';
import ShareButtons from '@/features/publications/dashboard/components/ShareButtons';
import FeaturedNewsCarousel from '@/features/news/components/FeaturedNewsCarousel';
import { buildBreadcrumbs } from '@/lib/utils/buildBreadcrumbs';
import transformNewsArticle from '@/lib/utils/transformNewsArticle';
import AdvancedCarousel from '@/shared/components/AdvancedCarousal';
import ContactSection from '@/shared/components/ContactSection';
import ExploreCard from '@/shared/components/ExploreCard';
import { EcosystemCard } from '@/shared/types/globals';
import { ArticleTrackerWrapper } from './ArticleTrackerWrapper';
import ArticleContentWrapper from './ArticleContentWrapper';
import { formatFeaturedNews, getFeaturedNews } from '@/lib/news';

interface ArticleDetailSection {
  title?: string;
  description?: string;
  imagePosition?: string;
  image?: {
    image?: {
      url?: string;
    };
  };
}

type PageProps = {
  params: Promise<{ slug: string | string[]; locale: string }>;
};

interface RawArticleDetailSection {
  title?: string;
  description?: string;
  imagePosition?: 'left' | 'right';
  image?: any;
}

interface TransformedArticleDetailSection {
  title: string;
  content: string;
  imagePosition: 'left' | 'right';
  imageUrl: string;
}
type Platform = 'Twitter' | 'Facebook' | 'LinkedIn' | 'WhatsApp';

type IconMap = Record<Platform, string>;

const iconMap: IconMap = {
  Twitter: '/assets/twitter_icongold.svg',
  Facebook: '/assets/facebook_icongold.svg',
  LinkedIn: '/assets/linkedin_icongold.svg',
  WhatsApp: '/assets/wapp_icongold.svg',
};

async function fetchJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.json();
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug, locale } = await params;

  if (!slug) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Missing article slug</div>;
  }

  const articleSlug = Array.isArray(slug) ? slug[0] : slug;

  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_STRAPI_API_BASE_URL is not configured');
  }

  const articleUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/articles?status=draft&filters[slug][$eq]=${encodeURIComponent(articleSlug)}&locale=${locale}&populate[event_details][populate][image][populate][image][fields][0]=url&populate[newsImage][fields]=url&populate[pdfFile][fields]=url`;

  const pageUrl = `${baseUrl}/api/pages?filters[slug][$eq]=news-publications&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url&populate[contents][on][home.contact-us][populate][cta][populate]=*`;

  const newsUrl = `${baseUrl}/api/news-pages?pagination[pageSize]=100&populate[news_cards][populate][image][populate]=image&populate[news_cards][populate][pdf][populate]=pdfFile&populate[featured_news][populate][image][populate]=image`;

  const [articleRes, pageJson, newsJson] = await Promise.all([
    fetch(articleUrl, {
      next: { revalidate: 21600, tags: ['/api/articles'] },
    }),
    fetchJson(pageUrl, { next: { revalidate: 21600, tags: ['/api/pages'] } }),
    fetchJson(newsUrl, { next: { revalidate: 3600, tags: ['/api/news-pages'] } }),
  ]);

  if (!articleRes.ok) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Error: Failed to fetch article</div>;
  }

  const articleJson = await articleRes.json();
  console.log("articleJson", articleJson);

  const articleData = articleJson?.data[0];
  console.log("articleData", articleData);

  if (!articleData) {
    return <div className="w-[85%] mx-auto py-10 md:py-20">Article not found</div>;
  }

  // Transform article details sections
  const articleDetails: TransformedArticleDetailSection[] = Array.isArray(articleData?.event_details)
    ? articleData.event_details.map((d: RawArticleDetailSection) => {
        let imageUrl = FALLBACK_IMAGE;
        if (d.image) {
          // Handle Strapi v4 structure: image.data.attributes.url
          if (d.image.data?.attributes?.url) {
            imageUrl = getStrapiMediaUrl(d.image.data.attributes.url);
          }
          // Handle legacy or direct structure: image.image.url or image.url
          else if (d.image.image?.url) {
            imageUrl = getStrapiMediaUrl(d.image.image.url);
          } else if (d.image.url) {
            imageUrl = getStrapiMediaUrl(d.image.url);
          }
        }
        return {
          title: d.title || 'Article detail title',
          content: d.description || 'Article detail description',
          imagePosition: 'center',
          imageUrl,
        };
      })
    : [];

  const sections = transformNewsArticle(pageJson, null, newsJson);
  sections.fullPath = sections.fullPath;

  const breadcrumbItems = buildBreadcrumbs(`/news-publications/${slug}`, {
    includeHome: true,
    homeLabel: 'Home',
    currentLabelOverride: articleData?.title || 'Article',
  });
  // Override label for '/news-publications'
  breadcrumbItems.forEach((item) => {
    if (item.href === '/news-publications') {
      item.label = 'News & Publications';
    }
  });

  const ecosystemCards = sections.ecosystem?.cards ?? [];
  const featuredNews = await getFeaturedNews();
  const filteredFeaturedNews = formatFeaturedNews(featuredNews);

  // Format date
  const date = articleData?.updatedAt
    ? new Date(articleData.updatedAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="bg-wfzo-gold-25 min-h-screen">
      <ArticleTrackerWrapper 
        articleId={articleData.documentId || articleData.id?.toString() || articleSlug}
        articleTitle={articleData.title}
        category={articleData.articleCategory}
      />
      <Hero imageUrl={sections.hero?.heroImage ?? undefined} />

      {/* MAIN CONTENT CONTAINER */}
      <div className="px-5 md:px-30 py-10">
        
        {/* BREADCRUMB */}
        <div className="mb-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>

        {/* ARTICLE HEADER */}
        <div className="mb-8 flex flex-col gap-4">
          <h1 className="font-montserrat text-4xl md:text-[60px] md:leading-[80px] font-black text-wfzo-grey-900">
            {articleData?.title || 'Article Name'}
          </h1>



          {/* DESCRIPTION */}
            <p className="font-source text-base leading-6 text-wfzo-grey-700 max-w-[700px]">
              {articleData.shortDescription || 'Article description'}
            </p>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
              {articleData?.authorImage && (
                <img
                  src={getStrapiMediaUrl(articleData.authorImage)}
                  alt={articleData?.authorName || ''}
                  className="w-9 h-9 object-cover rounded-lg opacity-100"
                />
              )}

              <div className="flex flex-col justify-center">
                <p className="text-[16px] leading-[20px] font-source font-semibold text-[#1A1A1A]">
                  {articleData?.authorName}
                </p>
                <p className="text-[12px] leading-[16px] font-source font-normal text-[#4D4D4D]">
                  {articleData?.organizationName}
                </p>
              </div>

              <span className="text-[#BE9C74] text-lg mx-2 hidden sm:inline">|</span>
            </div>

            <div className="flex items-center gap-3 text-[16px] leading-[20px] font-source font-bold text-[#1A1A1A]">
              <span className="relative top-[2px]">{date}</span>
              <span className="text-[#BE9C74]">|</span>
              <span>5 min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      <ArticleContentWrapper category={articleData.articleCategory}>
        <div className="px-5 py-5 md:px-20 xl:px-85 md:py-10">
          {articleDetails && articleDetails.length > 0 ? (
            articleDetails.map((section: TransformedArticleDetailSection, index: number) => {
              const imageUrl = section.imageUrl || FALLBACK_IMAGE;

              return (
                <div key={index} className="mb-8">

                  <h2 className="font-montserrat font-extrabold text-2xl leading-8 text-wfzo-grey-900 mb-4">
                    {section.title || 'Section Title'}
                  </h2>


                  <p className="font-source text-base leading-6 text-wfzo-grey-700 data-field" dangerouslySetInnerHTML={{ __html: section.content || 'Section Content' }}></p>


                  <div className={`my-6 text-center'}`}>
                    <img
                      src={imageUrl || FALLBACK_IMAGE}
                      alt={section.title || 'Article image'}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>


              </div>
            );
          })
        ) : (
        <div className="mb-8 flex flex-col gap-4">
          <h1 className="font-montserrat text-2xl md:text-[60px] md:leading-[80px] font-black text-wfzo-grey-900">
            {articleData?.title || 'Article Name'}
          </h1>



          {/* DESCRIPTION */}

            <p className="font-source text-base leading-6 text-wfzo-grey-700 max-w-[700px]">
              {articleData.shortDescription || 'Article description goes here.'}
            </p>



              <div className="my-6 text-center'">
                <img
                  src={articleData.newsImage?.url || FALLBACK_IMAGE}
                  alt={articleData?.title || 'Article image'}
                  className="w-full h-auto rounded-lg"
                />
              </div>


        </div>
      )}
      <div className="mt-8 flex flex-col items-start text-left ">
            <span className="text-[16px] leading-[18px] font-source font-bold mb-4 text-wfzo-grey-700">
              Share on
            </span>

            <ShareButtons iconMap={iconMap} />

          </div>
        </div>
      </ArticleContentWrapper>

    <div>{featuredNews.length > 0 && <FeaturedNewsCarousel items={filteredFeaturedNews} padding={true}/>}</div>

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

    {sections.contactUs && (
      <ContactSection
        title={sections.contactUs.title}
        description={sections.contactUs.description}
        backgroundImage={{ url: sections.contactUs.backgroundImage ?? undefined }}
        cta={sections.contactUs.cta ?? undefined}
      />
    )}
    </div>
  );
}
