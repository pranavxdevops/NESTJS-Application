import { FALLBACK_IMAGE } from '../constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import {
  transformTextImage,
  transformEcosystem,
  transformContactUs,
  transformHero,
} from './commonTransformation';
import { transformCTA, transformImage } from './transformHomepage';

// Helper – same as in events
function getYouTubeThumbnail(videohref: string): string {
  if (!videohref) return FALLBACK_IMAGE;
  const match = videohref.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/
  );
  const id = match ? match[1] : null;
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : FALLBACK_IMAGE;
}

export default function transformWebinarDetailPage(webinarJson: any, extraJson: any) {
  const webinar = webinarJson?.data?.[0];
  const extra = extraJson?.data?.[0];

  if (!webinar) return {};

  const attributes = webinar; // flattened attributes (common in your project)

  const normalizeMediaFiles = (mediaFile: any) => {
    if (!mediaFile) return [];
    return Array.isArray(mediaFile) ? mediaFile : [mediaFile];
  };

  // ────────────────────────────────────────────────
  // Main content sections (most important part for webinars)
  // Usually stored in webinar_details (array of rich text + image blocks)
  // ────────────────────────────────────────────────
  const details = Array.isArray(attributes?.webinar_details)
    ? attributes.webinar_details.map((d: any) => transformTextImage(d))
    : [];

  // ────────────────────────────────────────────────
  // Hero/banner section – using main webinar image + short/long description
  // Handle both nested {image: {url}} and direct {url} structures
  // ────────────────────────────────────────────────
  let bannerImageUrl = null;
  if (attributes.image) {
    // Check nested structure first {image: {image: {url}}} - this is your actual structure
    if (attributes.image.image?.url) {
      bannerImageUrl = attributes.image.image.url;
    }
    // Strapi v4 data structure {image: {data: {attributes: {url}}}}
    else if (attributes.image.data?.attributes?.url) {
      bannerImageUrl = attributes.image.data.attributes.url;
    }
    // Direct url structure (from populate=*)
    else if (attributes.image.url) {
      bannerImageUrl = attributes.image.url;
    }
    // Try transformImage as last resort
    else {
      const transformedImage = transformImage(attributes.image);
      if (transformedImage?.url) {
        bannerImageUrl = transformedImage.url;
      }
    }
  }

  const banner = {
    description: attributes.longDescription || attributes.description || '',
    imagePosition: attributes.imagePosition || 'left',
    imageUrl: bannerImageUrl,
    bg: attributes.backgroundImage?.image?.url
      ? getStrapiMediaUrl(attributes.backgroundImage.image.url)
      : attributes.backgroundImage?.url
        ? getStrapiMediaUrl(attributes.backgroundImage.url)
        : null,
    cta: transformCTA(attributes.cta),
  };

  // ────────────────────────────────────────────────
  // Shared footer blocks (ecosystem + contact-us) from extras page
  // ────────────────────────────────────────────────
  const heroSection = extra?.contents?.find((s: any) =>
    ['sections.sections-hero', 'sections.hero', 'sections.section-hero'].includes(s?.__component)
  );

  const ecosystemSection = extra?.contents?.find((s: any) => s?.__component === 'home.ecosystem');
  const contactUsSection = extra?.contents?.find((s: any) => s?.__component === 'home.contact-us');

  // ────────────────────────────────────────────────
  // Optional: video resources (if webinars have attached videos)
  // Same logic as events – adjust field names if different
  // ────────────────────────────────────────────────
  const videoResources = attributes.media_items
    ?.filter((media: any) => media.type === 'video' && Array.isArray(media.videoMediaFile) && media.videoMediaFile.length > 0)
    .flatMap((media: any) =>
      media.videoMediaFile.map((videoFile: any) => {
        const href = videoFile?.videohref?.trim() || '';
        const isYouTube = href.includes('youtube.com') || href.includes('youtu.be');

        return {
          id: `${media.id}-${videoFile.id || 'no-id'}`,
          title: media.title || 'Untitled Video',
          image: isYouTube ? getYouTubeThumbnail(href) : FALLBACK_IMAGE,
          organization: media.organizer || attributes.organizer || '',
          description: media.description || '',
          type: 'video',
          href,
          publishedDate: media.publishedAt || new Date().toISOString(),
        };
      })
    ) || [];

  // ────────────────────────────────────────────────
  // Optional: photo gallery/resources (if present)
  // ────────────────────────────────────────────────
  const photoResources = attributes.media_items
    ?.filter((media: any) => media.type === 'photo')
    .flatMap((media: any) => {
      const files = normalizeMediaFiles(media.mediaFile);

      return files.map((file: any) => ({
        title: media.title || '',
        image: getStrapiMediaUrl(file.url),
        organization: media.organizer || attributes.organizer || '',
        description: media.description || '',
        type: media.type || 'photo',
      }));
    }) || [];

  // ────────────────────────────────────────────────
  // ────────────────────────────────────────────────
  // Final normalized shape
  // ────────────────────────────────────────────────
  
  // Extract hero image - check multiple possible structures
  let heroImageUrl = null;
  if (heroSection?.heroBanner?.image?.url) {
    heroImageUrl = getStrapiMediaUrl(heroSection.heroBanner.image.url);
  } else if (bannerImageUrl) {
    // Fallback to main webinar image (already extracted above)
    heroImageUrl = bannerImageUrl;
  } else if (attributes.image?.image?.url) {
    // Nested structure
    heroImageUrl = attributes.image.image.url;
  } else if (attributes.image?.data?.attributes?.url) {
    // Strapi v4 structure
    heroImageUrl = attributes.image.data.attributes.url;
  } else if (attributes.image?.url) {
    heroImageUrl = attributes.image.url;
  }
  
  return {
    // Used in <Hero /> and <BreadcrumbContentHeader />
    hero: {
      heroImage: heroImageUrl,
      title: attributes?.title || '',
      description: attributes?.shortDescription || attributes?.description || '',
    },

    // Metadata / header
    fullPath: attributes?.fullPath || `/knowledge/webinars/${attributes.slug}`,
    title: attributes?.title || '',
    organization: attributes?.organizer || '',
    location: attributes?.location || 'Online',
    startDate: attributes?.startDate || null,     // ← most common field names
    endDate: attributes?.endDate || null,
    startDateTime: attributes?.startDateTime || attributes?.startDate || null,
    endDateTime: attributes?.endDateTime || attributes?.endDate || null,

    // CTA (register button)
    cta: attributes?.cta || null,

    // Main content blocks
    textImages: details,          // ← webinar_details transformed
    banner,

    // Optional media galleries
    videoResources,
    photoResources,
    documentResources: [],        // add logic if webinars have documents

    // Shared footer sections
    ecosystem: ecosystemSection ? transformEcosystem(ecosystemSection) : null,
    contactUs: contactUsSection ? transformContactUs(contactUsSection) : null,
  };
}