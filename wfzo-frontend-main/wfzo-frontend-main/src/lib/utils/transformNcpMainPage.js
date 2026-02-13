import { transformHero, transformTextImage, transformOfficeCardsByTitle,transformContactForm,transformEcosystem,transformContactUs } from "./commonTransformation";
import { getStrapiMediaUrl } from "@/lib/utils/getMediaUrl";
import { FALLBACK_IMAGE } from "@/lib/constants/constants";

export default function transformNcpMainPage(strapiJson, allOffices) {
  const data = strapiJson?.data?.[0];
  if (!data) return {};

  const sections = data.contents || [];



const heroSection = sections.find((s) => s.__component === 'sections.sections-hero');
  const textImageSections = sections.filter((s) => s.__component === 'sections.text-image');
  const contactBlock = sections.find((s) => s.__component === 'shared.contact-block');
  const officeCardSection = sections.find((s) => s.__component === 'sections.officecard');

  const featuredMemberSection = sections.find((s) => s.__component === "home.featured-member");
  const ecosystem = sections.find((s) => s.__component === 'home.ecosystem');
  const contactUs = sections.find((s) => s.__component === 'home.contact-us');

  // -----------------------------------
  // 2. FILTER OFFICES FROM allOffices
  // -----------------------------------
  const regionalOffices = allOffices.filter(o => o.officeType === "regional");
  const nationalOffices = allOffices.filter(o => o.officeType === "national");

const extractOfficeImageObject = (office) => {
  const img = office?.image?.image?.url
    ? getStrapiMediaUrl(office.image.image.url, FALLBACK_IMAGE)
    : FALLBACK_IMAGE;


  return {
    url: img,
    alt: office.companyname || "Office Image",
  };
};



  // Map both types into your UI structure
  const mapOffice = (office, type) => ({
    company: office.companyname || "",
    email: office.email || "",
    phone: office.phone || "",
    region: office.region || "",
    slug: office.slug,
    type,
    fullPath: `/about-us/contact-us/${type === "national" ? "national-contact-points" : "regional-offices"}/${office.slug}`,
    image: extractOfficeImageObject(office),
  });

  const roCards = regionalOffices.map(o => mapOffice(o, "regional"));
  const ncpCards = nationalOffices.map(o => mapOffice(o, "national"));

  // -----------------------------------
  // 3. Return the transformed object
  // -----------------------------------
  return {
    title: data.title,
    fullPath: data.fullPath,
    slug: data.slug,

    hero: heroSection ? transformHero(heroSection) : null,

    textImages: textImageSections?.map(ti => transformTextImage(ti)) || [],

    // RO + NCP Cards on Main Page
     regionalOfficeCards: [
    {
      title: " Other Regional Offices",
      description: regionalOffices.description,
      offices: roCards ?? []
    }
  ],
     // NATIONAL CONTACT POINT CARDS
  nationalContactPointCards: [
    {
      title: "  National Contact Points",
      description: nationalOffices.description,
      offices: ncpCards ?? []
    }
  ],

    // Office cards defined inside Strapi page (optional)
    officeCardSection: officeCardSection
      ? transformOfficeCardsByTitle(sections, officeCardSection.title)
      : null,


featuredMember: featuredMemberSection
    ? {
        title: featuredMemberSection.title,
        description: featuredMemberSection.shortDescription,

      }
    : null,



     contactBlock: contactBlock ? transformContactForm(contactBlock) : null,
        ecosystem: ecosystem ? transformEcosystem(ecosystem) : null,
        contactUs: contactUs ? transformContactUs(contactUs) : null
  };
}
 