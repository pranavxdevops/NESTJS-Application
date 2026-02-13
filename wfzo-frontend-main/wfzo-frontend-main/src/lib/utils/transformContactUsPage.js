import { transformHero, transformEcosystem, transformContactUs , transformContactForm, transformOfficeCardsByTitle, transformOfficesFromCollection } from './commonTransformation';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';
import { transformImage } from './transformHomepage';

export default function transformContactUsPage(strapiJson, offices = []) {
  const data = strapiJson.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];
  // Hero section
  const heroSection = sections.find(s => s.__component === 'sections.sections-hero');
  // Contact Information Block
  const contactInfoBlock = sections.find(s => s.__component === 'sections.contact-information-block');
  // Contact Form Block
  const contactBlock = sections.find(s => s.__component === 'shared.contact-block');
  // Explore About Us Section
  const ecosystem = sections.find(s => s.__component === 'home.ecosystem');
  // Contact Us (footer)
  const contactUsFooter = sections.find(s => s.__component === 'home.contact-us');

  // Transform offices from collection if provided, otherwise fall back to page-embedded offices
  let roCards = [];
  let ncpCards = [];

  if (offices && offices.length > 0) {
    const officeCards = transformOfficesFromCollection(offices, data);
    roCards = officeCards.roCards;
    ncpCards = officeCards.ncpCards;
  } else {
    roCards = transformOfficeCardsByTitle(sections, 'Regional Offices', data, 'regional-office');
    ncpCards = transformOfficeCardsByTitle(sections, 'National Contact Points', data, 'national-contact-points');
  }

  return {
    fullPath: data.fullPath,
    title: data.title,
    slug: data.slug,
    hero: heroSection ? transformHero(heroSection) : null,
    contactInfo: contactInfoBlock && {
      image: transformImage(contactInfoBlock.image),
      alt: contactInfoBlock.image?.alternateText || 'Contact Image',
      sections: (contactInfoBlock.contactData || []).map(office => ({
        title: office.title,
        items: [
          ...(office.address ? [{ type: 'address', value: office.address }] : []),
          ...((office.contactinfo || []).map(info => ({
            type: info.iconKey === 'emaill' ? 'email' : info.iconKey,
            value: info.info,
          })) || []),
        ],
      })),
    },
    contactBlock: contactBlock ? transformContactForm(contactBlock) : null,
    roCards,
    ncpCards,
    ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
    contactUs: contactUsFooter ? transformContactUs(contactUsFooter) : null,
  };
}
