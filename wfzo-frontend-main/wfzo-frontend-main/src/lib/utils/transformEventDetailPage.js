import { FALLBACK_IMAGE } from '../constants/constants';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import {
  transformTextImage,
  transformEcosystem,
  transformContactUs,
  transformHero,
} from './commonTransformation';
import { transformCTA, transformImage } from './transformHomepage';

// Transformer for a single Event detail page
// Expects:
//  - eventJson: response from /api/events?filters[slug][$eq]={slug}&populate=...
//  - extrasJson: optional response from /api/pages?filters[slug][$eq]=events&populate=... (for ecosystem/contact-us footer)
// Returns a normalized shape compatible with the existing page components
function getYouTubeThumbnail(videohref) {
  if (!videohref) return FALLBACK_IMAGE;
  const match = videohref.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/
  );
  const id = match ? match[1] : null;
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : FALLBACK_IMAGE;
}
export default function transformEventDetailPage(eventJson, extraJson) {
  // console.log("eventJson", eventJson);
  // console.log("extraJson", extraJson);
  const ev = eventJson?.data?.[0];
  const extra = extraJson?.data?.[0];
  if (!ev) return {};

  const attributes = ev; // Strapi v4 shape in this project uses flattened fields

  const normalizeMediaFiles = (mediaFile) => {
    if (!mediaFile) return [];
    return Array.isArray(mediaFile) ? mediaFile : [mediaFile];
  };
  // Event details sections (text-image like blocks)
  const details = Array.isArray(attributes?.event_details)
    ? attributes.event_details.map((d) => transformTextImage(d))
    : [];
  const banner = {
    description: ev.longDescription,
    imagePosition: ev.imagePosition || 'left',
    imageUrl: transformImage(ev.image),
    bg: ev.backgroundImage?.image?.url
      ? getStrapiMediaUrl(banner.backgroundImage.image.url, CONTENTHEADER_BG_IMAGE)
      : null,
    cta: transformCTA(ev.cta),
  };
  // Footer extras from events page (ecosystem, contact-us)
  //const extrasData = extrasJson?.data?.[0];
  //const contents = extrasData?.contents || [];
  const hero = extra.contents.find((s) =>
    ['sections.sections-hero', 'sections.hero', 'sections.section-hero'].includes(s?.__component)
  );
  const heroSection = hero ? transformHero(hero) : null;
  const ecosystemSection = extra.contents.find((s) => s?.__component === 'home.ecosystem');
  const contactUsSection = extra.contents.find((s) => s?.__component === 'home.contact-us');
  const videoResources = attributes.media_items
  ?.filter((media) => media.type === 'video' && Array.isArray(media.videoMediaFile) && media.videoMediaFile.length > 0)
  .flatMap((media) =>
    media.videoMediaFile.map((videoFile) => {
      const href = videoFile?.videohref?.trim() || '';
      const isYouTube = href.includes('youtube.com') || href.includes('youtu.be');

      return {
        id: `${media.id}-${videoFile.id}`, // Unique key
        title: media.title || 'Untitled Video',
        image: isYouTube ? getYouTubeThumbnail(href) : FALLBACK_IMAGE,
        organization: media.event?.organizer || media.organizer || attributes.organizer || '',
        description: media.description || '',
        type: 'video',
        href,
        publishedDate: media.publishedAt || new Date().toISOString(),
      };
    })
  ) || [];
  return {
    hero: {
      heroImage: heroSection?.heroImage,
      title: attributes?.title || '',
      description: attributes?.shortDescription || '',
    },
    fullPath: extra?.fullPath,
    title: attributes?.title || '',
    organization: attributes?.organizer || '',
    location: attributes?.location || '',
    startDateTime: attributes?.startDateTime || null,
    endDateTime: attributes?.endDateTime || null,
    cta: attributes?.cta || null,
    textImages: details,
    banner: banner,
    videoResources,
    photoResources:
      ev.media_items
        ?.filter((media) => media.type === 'photo')
        .flatMap((media) => {
          const files = normalizeMediaFiles(media.mediaFile);

          return files.map((file) => ({
            title: media.title,
            image: getStrapiMediaUrl(file.url),
            organization: media.organization,
            description: media.description,
            type: media.type,
          }));
        }) || [],

    documentResources: [],
    ecosystem: ecosystemSection ? transformEcosystem(ecosystemSection) : null,
    contactUs: contactUsSection ? transformContactUs(contactUsSection) : null,
  };
}
