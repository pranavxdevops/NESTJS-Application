import HeroAuth from '@/features/events/dashboard/component/HeroAuth';
import IncompleteProfileBanner from '@/features/profile/components/IncompleteProfileBanner';
import ClientKnowledgeSection from '@/features/knowledge/components/ClientKnowledgeSection';
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import { FALLBACK_IMAGE } from '@/lib/constants/constants';

interface KnowledgeItem {
  title: string;
  description: string;
  href?: string;
}

export default async function KnowledgeDashboardPage() {
  // Fetch page data from Strapi filtered by slug
  const pageUrl = `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=knowledge-dashboard&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats`;

  let heroImage = FALLBACK_IMAGE;

  try {
    const res = await fetch(pageUrl);

    if (res.ok) {
      const json = await res.json();
      const page = json.data?.[0];

      if (page) {
        const contents = page.contents || [];
        const heroSection = contents.find(
          (c: { __component?: string }) => c.__component === 'sections.sections-hero'
        );

        if (heroSection?.heroBanner?.image?.url) {
          heroImage = getStrapiMediaUrl(heroSection.heroBanner.image.url, FALLBACK_IMAGE);
        } else if (heroSection?.heroBanner?.image?.formats?.large?.url) {
          heroImage = getStrapiMediaUrl(
            heroSection.heroBanner.image.formats.large.url,
            FALLBACK_IMAGE
          );
        }
      }
    }
  } catch (error) {
    console.error('Error fetching knowledge dashboard page hero:', error);
  }

  // Knowledge items - these could come from Strapi in the future
  const leftColumnItems: KnowledgeItem[] = [
    {
      title: 'Ask an Expert',
      description:
        `Ask a Free Zone Expert gives you direct access to the world's leading free-zone thought leaders and decision makers. If you have any query in the field of free zones, World FZO's experts are happy to share their insights.`,
      href: '/knowledge/dashboard/ask-an-expert',
    },
    {
      title: 'Consultancy',
      description:
        `World FZO’s events provide members with high-level business development and strategic networking opportunities with peers, consultants, service-providers, policy makers, multi- lateral organizations and key business decision makers from around the world.`,
      href: '/knowledge/dashboard/consultancy-services',
    },
    {
      title: 'Atlas',
      description:
        'The World Free Zones Organization (World FZO) Atlas, curated by the World FZO Observatory, maps out all free zones and special economic zones around the world and provides insight into their industry focus and operations. Atlas is the flagship point of reference for free zones and the wider business community when establishing economic strategies.',
      href: '/knowledge/atlas',
    },
    {
      title: 'Policy Dialogue',
      description:
        'Engage in meaningful policy discussions and dialogues focused on free zone development, innovation, and global best practices. Connect with policymakers, industry leaders, and experts to shape the future of free zones worldwide.',
      href: '/knowledge/dashboard/policy-dialogue',
    },
  ];

  const rightColumnItems: KnowledgeItem[] = [
    {
      title: 'E-Learning',
      description:
        `We are committed in building expertise in developing and operating world class Free Zones. Sharing international best practices, benchmarking and competitiveness across all areas. Whether you're a beginner looking to start a new career or a seasoned professional seeking to enhance your expertise, our course offers a tailored learning experience that will help you achieve your goals.`,
      href: '/knowledge/dashboard/e-learning',
    },
    {
      title: 'Free Zone of the Future',
      description:
        'The Free Zone of the Future Index, which means ‘Prosperity’ in Arabic, is the core instrument of the Free Zone of the Future (FZF) Program recently launched by the World Free Zones Organisation (World FZO) – a Global Initiative for Local Prosperity. Feature your freezone in Free Zone of the Future index to become “The Free zone of the Future',
      href: '/knowledge/dashboard/free-zone-of-the-future',
    },
    {
      title: 'Certification Hub',
      description:
        'International Certifications designed for free zones that aim to meet the highest standards of safety, security, integrity, environment friendliness, innovation, quality and tech-readiness. World Free Zone’s Certification Programs are voluntary certifications built around established global standards. Free Zones accreditation is based on risk management, compliance management validated by internationally recognized third party experts.',
      href: '/knowledge/dashboard/certification-hub',
    },
  ];

  return (
    <div className="min-h-screen bg-wfzo-gold-25">
      {/* Hero Section */}
      <HeroAuth backgroundImage={heroImage} />

      {/* Main Content */}
      <div className="px-5 md:px-30 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[789fr_379fr] gap-4">
          {/* Left Column - Wider */}
          <div className="flex flex-col gap-4">
            {/* Incomplete Profile Banner */}
            <IncompleteProfileBanner />

            {/* Knowledge Cards - Left Column */}
            <ClientKnowledgeSection items={leftColumnItems} />
          </div>

          {/* Right Column - Narrower */}
          <ClientKnowledgeSection items={rightColumnItems} />
        </div>
      </div>
    </div>
  );
}
