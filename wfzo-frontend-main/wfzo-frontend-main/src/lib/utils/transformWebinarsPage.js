import { transformHero, transformEcosystem, transformContactUs } from './commonTransformation';
import { transformImage, transformCTA } from './transformHomepage';

export default function transformWebinarsPage(strapiJson) {
  const data = strapiJson.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];
  const hero = sections.find(s => s.__component === 'sections.sections-hero');
  const ecosystem = sections.find(s => s.__component === 'home.ecosystem');
  const contactUs = sections.find(s => s.__component === 'home.contact-us');
  
  // Find banner section (content-section component)
  const bannerSection = sections.find(s => s.__component === 'sections.bannersection');
  console.log("bannerSection:", bannerSection);
  let banner = null;
  if (bannerSection) {
    let bannerImageUrl = null;
    
    // Handle nested image structure
    if (bannerSection.image) {
      // Check nested structure {image: {image: {url}}}
      if (bannerSection.image.image?.url) {
        bannerImageUrl = bannerSection.image.image.url;
      }
      // Strapi v4 data structure
      else if (bannerSection.image.data?.attributes?.url) {
        bannerImageUrl = bannerSection.image.data.attributes.url;
      }
      // Direct url structure
      else if (bannerSection.image.url) {
        bannerImageUrl = bannerSection.image.url;
      }
      // Try transformImage as fallback
      else {
        const transformedImage = transformImage(bannerSection.image);
        if (transformedImage?.url) {
          bannerImageUrl = transformedImage.url;
        }
      }
    }
    
    banner = {
      title: bannerSection.title || '',
      description: bannerSection.shortDescription || '',
      imagePosition: bannerSection.imagePosition || 'left',
      imageUrl: bannerImageUrl,
      cta: transformCTA(bannerSection.cta),
    };
  }

  return {
    title: data.title,
    slug: data.slug,
    fullPath: data.fullPath,
    description: data.description || null,
    hero: hero ? transformHero(hero) : null,
    banner: banner,
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUs ? transformContactUs(contactUs) : null,
  };
}

export function transformWebinarsList(webinarsJson) {
  const webinars = webinarsJson.data || [];
  
  return webinars.map((webinar) => {
    const attributes = webinar.attributes;
    const startDate = attributes?.startDate;
    const endDate = attributes?.endDate;
    const now = new Date();
    const isPast = endDate ? new Date(endDate) < now : startDate ? new Date(startDate) < now : false;

    // Format date
    let dateStr = '';
    if (startDate) {
      const start = new Date(startDate);
      dateStr = start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      if (endDate && endDate !== startDate) {
        const end = new Date(endDate);
        dateStr += ` - ${end.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}`;
      }
    }

    // Format time
    let timeStr = '';
    if (startDate) {
      const start = new Date(startDate);
      timeStr = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      if (endDate) {
        const end = new Date(endDate);
        timeStr += ` - ${end.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`;
      }
      timeStr += ' (GMT +4)';
    }

    return {
      id: webinar.id,
      slug: attributes?.slug || '',
      title: attributes?.title || 'Untitled Webinar',
      organization: attributes?.organizer || 'World Free Zones Organization',
      date: dateStr,
      time: timeStr,
      location: attributes?.location || '',
      imageUrl: transformImage(attributes?.image),
      status: isPast ? 'past' : 'webinar',
      startDate: attributes?.startDate,
      endDate: attributes?.endDate,
      isPast,
      isRegistered: false
    };
  });
}
