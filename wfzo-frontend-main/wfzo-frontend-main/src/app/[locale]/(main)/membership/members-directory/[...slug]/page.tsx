import MemberPage from "@/features/membership/components/memberPage";
import transformMemberDirectory from "@/lib/utils/transformMemberDirectoryPage";



const page = async () => {

const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/pages?filters[slug][$eq]=members-directory&populate=*
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug
&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url
&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url
&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats
&populate[contents][on][home.contact-us][populate][cta][populate]=*
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url
&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats
&populate[contents][on][home.about-summary][populate][statistics][populate]=*
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][0]=url
&populate[contents][on][shared.contact-block][populate][image][populate][image][fields][1]=formats
&populate[contents][on][shared.contact-block][populate][formFields][populate]=*
&populate[contents][on][shared.contact-block][populate][cta][populate]=*
&populate[contents][on][sections.testimonials][populate][testimonial][populate]=*
&populate[contents][on][home.featured-member][populate][cta][populate]=*`,
    { next: { revalidate: 21600, tags: ['/api/members-directory'] } }
  );
  if (!res.ok) {
    return <div className="w-[80%] mx-auto py-20">Error: Failed to fetch page data</div>;
  }
    const json = await res.json();
    const sections = transformMemberDirectory(json) || {};

    return <MemberPage sections={sections} />;

};

export default page;
