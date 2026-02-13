import { FALLBACK_IMAGE } from "../constants/constants";
import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';
import {getCountryISOCode} from "@/lib/utils/getCountryISOCode"
import { transformImage,transformCTA } from './transformHomepage';

// Transform hero section
export function transformHero(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        description: section.description,
        heroImage: section.heroBanner?.image?.url || null
    };
}

// Transform text-image section
export function transformTextImage(section) {
    return {
        title: section.title,
        content: section.description,
        imagePosition: section.imagePosition || "left",
        imageUrl: transformImage(section.image),
    };
}

// Transform ecosystem section
export function transformContactForm(contactBlock) {
    return contactBlock && {
      title: contactBlock.title,
      description: contactBlock.shortDescription,
      imageUrl: transformImage(contactBlock.image),
      formFields: (contactBlock.formFields || []).map(field => ({
        id: field.id,
        label: field.label,
        placeholder: field.placeholder,
        type: field.type,
        required: field.required,
      })),
      cta: contactBlock.cta && {
        title: contactBlock.cta.title,
        href: contactBlock.cta.href,
        targetBlank: contactBlock.cta.targetBlank,
        variant: contactBlock.cta.variant,
        type: contactBlock.cta.type,
      },
    }
}

// Transform ecosystem section
export function transformEcosystem(section) {
    return {
        title: section.title,
        description: section.shortDescription,
        cards: section.cards?.map(card => ({
            title: card.title,
            backgroundImage: transformImage(card.image),
            link: card.internalLink?.fullPath || '/',
        })) || [],
    };
}

// Transform contact-us section
export function transformContactUs(section) {
    return {
        title: section.title,
        description: section.shortDescription,
        backgroundImage: section.backgroundImage?.image?.url
            ? getStrapiMediaUrl(section.backgroundImage.image.url, FALLBACK_IMAGE)
            : null,
        cta: transformCTA(section.cta),
    };
}

// Transform office card sections (e.g., Regional Offices, National Contact Points)
// sections: page contents array
// title: exact title to filter (e.g., 'Regional Offices' or 'National Contact Points')
// pageData: object containing page-level fields like fullPath
// detailPathSegment: path segment to append for detail pages (e.g., 'regional-office')
export function transformOfficeCardsByTitle(sections, title, pageData, detailPathSegment) {
    const normalizedTitle = title.trim().toLowerCase();
    const officeCards = sections.filter(
         s => s.__component === 'sections.officecard' &&  s.title?.trim().toLowerCase() === normalizedTitle
    );

    return officeCards.map(card => ({
        title: card.title,
        description: card.description,
        isChevronEnabled: card.isChevronEnabled,
        cta: card.cta && {
            title: card.cta.title,
            href: card.cta.href,
            targetBlank: card.cta.targetBlank,
            variant: card.cta.variant,
            type: card.cta.type,
            internalLink: card.cta.internalLink?.fullPath || null,
        },
        offices: (card.offices || []).map(office => {
            const slug = office.slug || '';
            const cardUrl = slug && pageData?.fullPath
                ? detailPathSegment ? `${pageData.fullPath}/${slug}`: `${pageData.fullPath}/${slug}`
                : undefined;

            return {
                company: office.companyname || office.company || '',
                address: office.address || '',
                country: office.region || office.country || '',
                flag: getCountryISOCode(office.flag || office.country),
                email: office.email || '',
                phone: office.phone || '',
                showImage: true,
                image: transformImage(office.image),
                slug,
                cardUrl,
                // Map second-level text blocks to a standard text-image shape array
                textImages: (office.officeSecondLevelText || []).map(txt => ({
                    title: txt.title || null,
                    content: txt.description || null,
                    imagePosition: txt.imagePosition || 'left',
                    imageUrl: transformImage(txt.image),
                })),
            };
        }),
    }));
}

// Transform offices from the offices collection type based on officeType field
// offices: array of office objects from /api/offices collection
// pageData: object containing page-level fields like fullPath
// Returns: { roCards, ncpCards } where each is an array of card objects with offices grouped by type
export function transformOfficesFromCollection(offices, pageData) {
    if (!offices || offices.length === 0) {
        return { roCards: [], ncpCards: [] };
    }

    const regionalOffices = offices.filter(office => office.officeType === 'regional');
    const nationalOffices = offices.filter(office => office.officeType === 'national');

    const transformOfficeData = (office) => {
        const slug = office.slug || '';
        const detailPathSegment = office.officeType === 'regional' ? 'regional-office' : 'national-contact-points';
        const cardUrl = slug && pageData?.fullPath
            ? `${pageData.fullPath}/${detailPathSegment}/${slug}`
            : undefined;

        return {
            company: office.companyname || office.company || '',
            address: office.address || '',
            country: office.region || office.country || '',
            flag: getCountryISOCode(office.flag || office.country),
            email: office.email || '',
            phone: office.phone || '',
            showImage: true,
            image: transformImage(office.image),
            slug,
            cardUrl,
            textImages: (office.officeSecondLevelText || []).map(txt => ({
                title: txt.title || null,
                content: txt.description || null,
                imagePosition: txt.imagePosition || 'left',
                imageUrl: transformImage(txt.image),
            })),
        };
    };

    const roCards = regionalOffices.length > 0 ? [{
        title: 'Regional Offices',
        description: 'Our regional offices across the globe',
        isChevronEnabled: false,
        cta: null,
        offices: regionalOffices.map(transformOfficeData),
    }] : [];

    const ncpCards = nationalOffices.length > 0 ? [{
        title: 'National Contact Points',
        description: 'National contact points in various countries',
        isChevronEnabled: false,
        cta: null,
        offices: nationalOffices.map(transformOfficeData),
    }] : [];

    return { roCards, ncpCards };
}

// Transform a single Event item to a normalized shape (suitable for EventsCard consumption)
export function transformEventItem(event) {
    if (!event) return null;

    // Resolve image from coverImage.image.url if available, otherwise fallback
    const imageUrl = event.image?.image?.url
        ? getStrapiMediaUrl(event.image.image.url, FALLBACK_IMAGE)
        : FALLBACK_IMAGE;

    const ctaHref = event?.cta?.href
        || event?.cta?.internalLink?.fullPath
        || event?.registrationUrl
        || null;

    return {
        id: event.id,
        slug: event.slug || '',
        title: event.title || '',
        organization: event.organizer || '',
        description: event.shortDescription || '',
        location: event.location || '',
        startDateTime: event.startDateTime || null,
        endDateTime: event.endDateTime || null,
        image: imageUrl,
        cta: event.cta ? {
            title: event.cta.title || null,
            href: ctaHref,
            targetBlank: Boolean(event.cta.targetBlank),
            variant: event.cta.variant,
            type: event.cta.type,
        } : (ctaHref ? { title: 'Register', href: ctaHref, targetBlank: false } : null),
    };
}

// Filter and sort only upcoming events (events that start in the future or are ongoing)
export function filterAndSortUpcomingEvents(events = []) {
    const now = Date.now();
    const isUpcoming = (ev) => {
        const start = ev?.startDateTime ? new Date(ev.startDateTime).getTime() : null;
        const end = ev?.endDateTime ? new Date(ev.endDateTime).getTime() : null;
        // Upcoming if starts in the future OR currently ongoing (end in the future)
        return (start !== null && start >= now) || (end !== null && end >= now);
    };

    return events
        .filter((ev) => isUpcoming(ev))
        .sort((a, b) => {
            const aTime = a?.startDateTime ? new Date(a.startDateTime).getTime() : (a?.endDateTime ? new Date(a.endDateTime).getTime() : Number.MAX_SAFE_INTEGER);
            const bTime = b?.startDateTime ? new Date(b.startDateTime).getTime() : (b?.endDateTime ? new Date(b.endDateTime).getTime() : Number.MAX_SAFE_INTEGER);
            return aTime - bTime;
        });
}

export function filterAndSortPastEvents(events = []) {
    const now = Date.now();
    const occurredInPast = (ev) => {
        const start = ev?.startDateTime ? new Date(ev.startDateTime).getTime() : null;
        const end = ev?.endDateTime ? new Date(ev.endDateTime).getTime() : null;
        if (end !== null) return end < now;
        if (start !== null) return start < now;
        return false;
    };

    const getComparableTime = (ev) => {
        if (ev?.endDateTime) {
            return new Date(ev.endDateTime).getTime();
        }
        if (ev?.startDateTime) {
            return new Date(ev.startDateTime).getTime();
        }
        return Number.NEGATIVE_INFINITY;
    };

    return events
        .filter((ev) => occurredInPast(ev))
        .sort((a, b) => getComparableTime(b) - getComparableTime(a));
}

export function transformNewsCardItem(card, context = {}) {
    if (!card) return null;

    const imageUrl = card.image?.image?.url
        ? getStrapiMediaUrl(card.image.image.url, FALLBACK_IMAGE)
        : FALLBACK_IMAGE;
    const imageAlt = card.image?.image?.alternativeText
        || card.image?.image?.name
        || card.image?.alternateText
        || card.title
        || '';

    const pdfUrl = card.pdf?.pdfFile?.url
        ? getStrapiMediaUrl(card.pdf.pdfFile.url, undefined)
        : null;

    return {
        id: card.id,
        documentId: card.documentId,
        title: card.title || '',
        slug: card.slug || '',
        author: card.author || '',
        minutesToRead: card.minutesToRead ?? null,
        isLocked: card.isLocked ?? false,
        source: card.source || 'article',
        publishedDate: card.publishedDate || null,
        shortDescription: card.shortDescription || card.pdf?.shortDescription || '',
        categoryTitle: context.categoryTitle || null,
        categorySlug: context.categorySlug || null,
        image: {
            url: imageUrl,
            alt: imageAlt,
            href: card.image?.href || null,
        },
        pdf: pdfUrl
            ? {
                url: pdfUrl,
                title: card.pdf?.title || null,
                summary: card.pdf?.summary || null,
            }
            : null,
    };
}

export function normalizeNewsPage(entry) {
    if (!entry) return null;
    const cards = (entry.news_cards || [])
        .map((card) => transformNewsCardItem(card, {
            categoryTitle: entry.title || '',
            categorySlug: entry.slug || '',
        }))
        .filter(Boolean);

    return {
        id: entry.id,
        documentId: entry.documentId,
        title: entry.title || '',
        slug: entry.slug || '',
        fullPath: entry.fullPath || null,
        cards,
    };
}


// Transform expert-insight-block section
export function transformExpertInsights(section) {
    if (!section) return null;

    const items = (section.expert_insights || []).map((insight, idx) => {
        const videos = (insight.media_items || []).map((mediaItem) => {
            let videoSrc = '';
            
            // Prioritize href (external URLs like YouTube)
            if (mediaItem.href) {
                videoSrc = mediaItem.href;
            } 
            // Fallback to mediaFile (uploaded media files)
            else if (mediaItem.mediaFile?.url) {
                videoSrc = getStrapiMediaUrl(mediaItem.mediaFile.url);
            }

            return {
                src: videoSrc,
                title: mediaItem.title || null,
            };
        }).filter(v => v.src); // Only include items with valid video sources

        return {
            id: String(insight.id || idx),
            question: insight.question || '',
            videos: videos,
        };
    });

    return {
        title: section.title || '',
        items: items,
    };
}
