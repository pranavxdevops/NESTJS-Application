export async function getPageBySlug(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_STRAPI_API_BASE_URL");
  }

  const pageUrl =
    `${baseUrl}/api/pages` +
    `?filters[slug][$eq]=${encodeURIComponent(slug)}` +
    `&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][0]=url` +
    `&populate[contents][on][sections.sections-hero][populate][heroBanner][populate][image][fields][1]=formats` +
    `&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][0]=url` +
    `&populate[contents][on][sections.bannersection][populate][image][populate][image][fields][1]=formats` +
    `&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][0]=url` +
    `&populate[contents][on][sections.bannersection][populate][backgroundImage][populate][image][fields][1]=formats` +
    `&populate[contents][on][home.ecosystem][populate][cards][fields][0]=title` +
    `&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][0]=title` +
    `&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][1]=slug` +
    `&populate[contents][on][home.ecosystem][populate][cards][populate][internalLink][fields][2]=fullPath` +
    `&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][0]=url` +
    `&populate[contents][on][home.ecosystem][populate][cards][populate][image][populate][image][fields][1]=formats` +
    `&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][0]=url` +
    `&populate[contents][on][shared.expert-insight-block][populate][expert_insights][populate][media_items][populate][mediaFile][fields][0]=url` +
    `&populate[contents][on][home.contact-us][populate][backgroundImage][populate][image][fields][1]=formats` +
    `&populate[contents][on][home.contact-us][populate][cta][populate]=*`;

  let res;
  try {
   res = await fetch(pageUrl, {
    next: { revalidate: 21600, 
      tags: ["pages",`page-${slug}`],
    },
  });
 } catch (err) {
  console.error("FETCH ERROR:", err);
  throw err;
 }

  return res.json();
}