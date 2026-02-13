import transformHomepage from '@/lib/utils/transformHomepage';
import componentMap from '@/lib/utils/componentMap';
import { getPageSeo } from '@/lib/utils/seo/fetchSeo';
import { generateSeo } from '@/lib/utils/seo/generateSeo';
import RouteGuard from '@/shared/components/RouteGuard';

type HomeSection = {
  id?: string | number;
  component?: string;
  __component?: string;
  title?: string;
  description?: string;
  backgroundImage?: { url?: string } | null;
  cta?: { title?: string; url?: string; targetBlank?: boolean };
  [key: string]: unknown;
};
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const urlSlug = '/'
    return getPageSeo(urlSlug, locale);
}


export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const urlSlug = '/';
  
  // 1️⃣ Fetch data from Strapi
  // Note: protected-populate plugin with auto-populate:true handles nested data automatically
  const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/home?locale=${locale}`, {
    next: { revalidate: 21600, tags: ['/api/home'] },
  });

  if (!res.ok) throw new Error('Failed to fetch homepage data');

  const data = await res.json();
  const refinedData = transformHomepage(data);
  const sections = refinedData?.sections || [];
  const seo = generateSeo(data?.data?.seo, locale, urlSlug);
  // 2️⃣ Render sections dynamically
  return (
    <div className="antialiased overflow-x-hidden">
    <RouteGuard isProtected={false} />
    <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
      />
      <main>
        {sections.map((section: HomeSection, index: number) => {
          const componentName = section.component || section.__component;
          if (!componentName) return null;
          const Component = componentMap[componentName as keyof typeof componentMap];
          if (!Component) return null;

          // 1) Skip rendering the standalone membership section (it will be embedded in VideoContainerSection)
          if (componentName === 'home.membership-section') {
            return null;
          }

          // 2) If this is the video container section, pass membershipSection details as an extra prop
          if (
            componentName === 'home.video-container-block'
          ) {
            const membershipSection = sections.find(
              (s: HomeSection) => (s.component || s.__component) === 'home.membership-section'
            );

            const membershipProps = membershipSection
              ? {
                  title: membershipSection.title,
                  description: membershipSection.description,
                  backgroundImage: membershipSection.backgroundImage,
                  cta: membershipSection.cta,
                  // optional layout tweaks the MembershipSection supports
                  removeAbsolute: false,
                }
              : undefined;

            return (
              <Component
                key={`${section.id ?? 'video'}-${index}`}
                {...section}
                membershipSection={membershipProps}
              />
            );
          }

          // Default render for all other sections
          return <Component key={`${section.id}-${index}`} {...section} />;
        })}
      </main>
    </div>
  );
}
