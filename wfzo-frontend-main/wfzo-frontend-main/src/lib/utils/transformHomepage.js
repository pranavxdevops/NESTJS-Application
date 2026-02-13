export default function transformHomepage(json) {
    return {
        id: json.data.id,
        title: json.data.title,
        version: json.data.updatedAt,
        sections: json.data.sections?.map((section) => {
            switch (section.__component) {
                case "home.hero":
                    return transformHero(section);
                case "home.about-summary":
                    return transformAboutSummary(section);
                case "home.events-spotlight":
                    return transformEventsSpotlight(section);
                case "home.newsand-publication":
                    return transformNewsAndPublications(section);
                case "home.featured-member":
                    return transformFeaturedMember(section);
                case "home.video-container-block":
                    return transformVideoContainerBlock(section);
                case "home.ecosystem":
                    return transformEcosystem(section);
                case "home.membership-section":
                    return transformMembership(section);
                case "home.contact-us":
                    return transformContact(section);
                default:
                    return section;
            }
        }),
    };
}




// Function to transform image object
export function transformImage(imageObj) {
    if (!imageObj || !imageObj.image) return null;

    const img = imageObj.image;

    return {
        id: imageObj.id,
        href: imageObj.href || null,
        alt: imageObj.alternateText || img.alternativeText || null,
        url: img.url, // original full-size image
        formats: {
            thumbnail: img.formats?.thumbnail?.url || null,
            small: img.formats?.small?.url || null,
            medium: img.formats?.medium?.url || null,
            large: img.formats?.large?.url || null,
        },
        width: img.width,
        height: img.height,
    };
}
export function transformThumbnailImage(imageObj) {
    if (!imageObj) return null;

    const img = imageObj;

    return {
        id: imageObj.id,
        href: imageObj.href || null,
        alt: imageObj.alternateText || img.alternativeText || null,
        url: img.url, // original full-size image
        formats: {
            thumbnail: img.formats?.thumbnail?.url || null,
            small: img.formats?.small?.url || null,
            medium: img.formats?.medium?.url || null,
            large: img.formats?.large?.url || null,
        },
        width: img.width,
        height: img.height,
    };
}


// Function to transform CTA
export function transformCTA(cta) {
    if (!cta) return null;

    return {
        id: cta.id,
        title: cta.title || null,
        targetBlank: !!cta.targetBlank,
        variant: cta.variant || "PRIMARY",
        type: cta.type || "internal",
        url: cta.type === "internal"
            ? (cta.internalLink?.fullPath || null)
            : (cta.href || null),
    };
}


/**
 * HERO
 */
function transformHero(section) {
    return {
        component: section.__component,
        id: section.id,
        autoPlay: section.autoPlay,
        loop: section.loop,
        autoPlayMs: section.autoPlayMs,
        eventTitle: section.eventTitle,
        // headline: section.headline,
        // subhead: section.subhead,
        arrowBasedNavigation: section.arrowBasedNavigation,
        overlayEvent: (section.overlayEvent && section.overlayEvent.primaryEvent)
            ? {
                id: section.overlayEvent.id,
                title: section.overlayEvent.title,
                summary: section.overlayEvent.shortDescription,
                startDateTime: section.overlayEvent.startDateTime,
                endDateTime: section.overlayEvent.endDateTime,
                //How to use this?
                slug: section.overlayEvent.slug,
                registrationUrl: section.overlayEvent.registrationUrl,
                cta: transformCTA(section.overlayEvent.cta),
            }
            : null,

        slides: section.slides?.map((slide) => ({
            id: slide.id,
            backgroundType: slide.backgroundType,
            headline: slide.headline,
            subhead: slide.subheadline,
            image: transformImage(slide.image),//How to take image    
            video: slide.video,
            cta: transformCTA(slide.cta)
        })) || [],
    };
}



/**
 * ABOUT SUMMARY
 */
function transformAboutSummary(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        shortDescription: section.shortDescription,
        //image
        backgroundImage: transformImage(section.backgroundImage),
        // handle cta 
        cta: transformCTA(section.cta),
        stats: section.statistics?.map((s) => ({
            id: s.id,
            iconKey: s.iconKey,
            value: s.value,
            label: s.label,
        })),
    };
}



/**
 * EVENTS SPOTLIGHT
 */
function transformEventsSpotlight(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        curationMode: section.curationMode,
        limit: section.limit,
        cta: transformCTA(section.cta),
        selectedEvents: section.selectedEvents.map((ev) => ({
            id: ev.id,
            title: ev.title,
            organizer: ev.organizer,
            summary: ev.shortDescription,
            startDateTime: ev.startDateTime,
            endDateTime: ev.endDateTime,
            location: ev.location,
            primaryEvent: ev.primaryEvent,
            slug: ev.slug,
            registrationUrl: ev.registrationUrl,
            coverImage: transformImage(ev.image),
            cta: transformCTA(ev.cta),
        })),
    };
}





/**
 * NEWS & PUBLICATIONS
 */
function transformNewsAndPublications(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        // Change this and handle url to pages properly // i think it is done just test
        url: section.internalLink?.fullPath || null,
        tabs: section.tabs?.map((tab) => ({
            id: tab.id,
            title: tab.title,
            order: tab.order,
            isDefault: tab.isDefault,
            sort: tab.sort,
            news_cards: tab.news_cards?.map((card) => ({
                id: card.id,
                title: card.title,
                slug: card.slug,
                minutesToRead: card.minutesToRead,
                cardImage: transformImage(card.image),
                publishedDate: card.publishedDate,

                // Design and find out how to handle url for this ??
                url: section.internalLink?.fullPath + "/" + card.slug || null,
                // slug: card.slug,
                isLocked: card.isLocked,
                source: card.source,
                shortDescription: card.pdf?.shortDescription || card.shortDescription || null,
                document: card.pdf?.pdfFile?.url || null,
                author: card.author
                    ? {
                        name: card.author.name,
                        company: card.author.company,
                        photo: transformImage(card.author.image),
                    }
                    : null,
                documentSection: card.documentSection,
                
                    
                

            })),
        })),
        cta: transformCTA(section.cta),
    };
}

/**
 * FEATURED MEMBER
 */
export function transformFeaturedMember(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        summary: section.shortDescription,
        cta: transformCTA(section.cta)
    }
}



/**
 * VIDEO CONTAINER BLOCK
 */
function transformVideoContainerBlock(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        shortDescription: section.shortDescription,
        videoAutoplay: section.videoAutoplay,

        backgroundImage: transformImage(section.image),
        video: {
                url: section.video?.[0].videoAsset?.url || null,
                caption: section.video?.[0].videoAsset?.name || null,
        },
        cta: transformCTA(section.cta)
    };
}






// ✅ Ecosystem Section
function transformEcosystem(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        description: section.shortDescription,
        backgroundImage: transformImage(section.backgroundImage),
        cards: section.cards.map((card) => ({
            id: card.id,
            title: card.title,
            description: card.shortDescription,
            // is there href in image? 
            href: card.href,
            image: transformImage(card.image),

        })),
    };
}





// ✅ Membership Section
function transformMembership(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        description: section.shortDescription,

        backgroundImage: transformImage(section.backgroundImage),
        cta: transformCTA(section.cta)
    };
}




// ✅ Contact Us Section
function transformContact(section) {
    return {
        component: section.__component,
        id: section.id,
        title: section.title,
        description: section.shortDescription,
        backgroundImage: transformImage(section.backgroundImage),
        cta: transformCTA(section.cta)
    };
}



// Footer Section 

export function transformFooter(data) {
    if (!data || !data.data) return null;

    const footer = data.data;

    return {
        id: footer.id,
        copyrightText: footer.copyrightText || null,

        newsLetter: footer.newsLetter
            ? {
                id: footer.newsLetter.id,
                title: footer.newsLetter.title,
                description: footer.newsLetter.shortDescription,
                emailIcon: footer.newsLetter.emailIcon,
                emailText: footer.newsLetter.emailText,
                sendIcon: footer.newsLetter.sendIcon,
                subscribeText: footer.newsLetter.subscribeText,
                subscribedText: footer.newsLetter.subscribedText,
            }
            : null,

        socialLinks: footer.socialLink?.map((link) => ({
            id: link.id,
              platform: link.platform,
            href: link.href,
        })) || [],

        legalLinks: footer.legalLink?.map((link) => ({
            id: link.id,
            title: link.title,
            href: link.href,
            type: link.type,
            variant: link.variant,
        })) || [],

        languages: footer.language?.map((lang) => ({
            id: lang.id,
            title: lang.title,
            code: lang.code,
        })) || [],
    };
}