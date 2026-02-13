import { transformEcosystem, transformContactUs,transformContactForm } from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';

export default function transformFaqPage(strapiJson) {
  const data = strapiJson.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];

  // Hero section
  const heroSection = sections.find(s => s.__component === 'sections.sections-hero');

  // FAQ blocks
  const wfzoBlocks = sections.filter(s => s.__component === 'shared.faq-block' && s.title === 'About World FZO');

  const membershipBlocks = sections.filter(s => s.__component === 'shared.faq-block' && s.title === 'Membership');


  // Contact Us section (home.contact-us)
  const contactUs = sections.find(s => s.__component === 'home.contact-us');

  // Contact Block section (shared.contact-block)
  const contactBlock = sections.find(s => s.__component === 'shared.contact-block');

  // Explore section
  const ecosystem = sections.find(s => s.__component === 'home.ecosystem');

  return {
    title: data.title,
    slug: data.slug,
    fullPath: data.fullPath,
    hero: heroSection && {
      title: heroSection.title,
      description: heroSection.description,
      imageUrl: heroSection.heroBanner?.image?.url
        ? getStrapiMediaUrl(heroSection.heroBanner.image.url, FALLBACK_IMAGE)
        : null,
    },
    wfzoFaqSections: wfzoBlocks.map(block => ({
      title: block.title,
      items: (block.faqs || []).map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        // Add link or other fields if needed
      })),
    })),
    membershipFaqSections: membershipBlocks.map(block => ({
      title: block.title,
      items: (block.faqs || []).map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        // Add link or other fields if needed
      })),
    })),
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUs ? transformContactUs(contactUs) : null,
    contactBlock: contactBlock ? transformContactForm(contactBlock) : null,
  };
}
