import { getStrapiMediaUrl } from '@/lib/utils/getMediaUrl';

type StrapiEventResponse = {
  data: Array<{
    id: number;
    attributes: {
      title?: string;
      organization?: string;
      location?: string;
      description?: string;
      slug?: string;
      startDateTime?: string;
      endDateTime?: string;
      coverImage?: {
        data?: {
          attributes?: {
            image?: {
              data?: {
                attributes?: {
                  url?: string;
                };
              };
            };
          };
        };
      };
      event_details?: Array<{
        __component?: string;
        id?: number;
        title?: string;
        content?: string;
        imagePosition?: 'left' | 'right';
        image?: {
          data?: {
            attributes?: {
              image?: {
                data?: {
                  attributes?: {
                    url?: string;
                  };
                };
              };
            };
          };
        };
      }>;
      resources?: {
        data?: Array<{
          id: number;
          attributes: {
            title?: string;
            description?: string;
            resourceType?: 'video' | 'photo' | 'document';
            isLocked?: boolean;
            publishedDate?: string;
            readTime?: string;
            image?: {
              data?: {
                attributes?: {
                  image?: {
                    data?: {
                      attributes?: {
                        url?: string;
                      };
                    };
                  };
                };
              };
            };
            category?: {
              data?: {
                attributes?: {
                  name?: string;
                  color?: string;
                  backgroundColor?: string;
                };
              };
            };
            author?: {
              data?: {
                attributes?: {
                  name?: string;
                  organization?: string;
                };
              };
            };
            document?: {
              data?: {
                attributes?: {
                  url?: string;
                };
              };
            };
          };
        }>;
      };
      cta?: {
        url?: string;
        title?: string;
        targetBlank?: boolean;
      };
    };
  }>;
};

type StrapiPageResponse = {
  data: Array<{
    attributes: {
      contents?: Array<{
        __component?: string;
        title?: string;
        description?: string;
        buttonText?: string;
        backgroundImage?: {
          data?: {
            attributes?: {
              image?: {
                data?: {
                  attributes?: {
                    url?: string;
                  };
                };
              };
            };
          };
        };
        cards?: Array<{
          title?: string;
          image?: {
            data?: {
              attributes?: {
                image?: {
                  data?: {
                    attributes?: {
                      url?: string;
                    };
                  };
                };
              };
            };
          };
          internalLink?: {
            data?: {
              attributes?: {
                title?: string;
                slug?: string;
                fullPath?: string;
              };
            };
          };
        }>;
      }>;
    };
  }>;
};

export default function transformPastEventDetailPage(
  eventJson: StrapiEventResponse,
  extraJson: StrapiPageResponse
) {
  const event = eventJson?.data?.[0];
  const extras = extraJson?.data?.[0]?.attributes?.contents || [];

  const hero = {
    title: event?.attributes?.title || '',
    organization: event?.attributes?.organization || '',
    description: event?.attributes?.description || '',
    heroImage: getStrapiMediaUrl(
      event?.attributes?.coverImage?.data?.attributes?.image?.data?.attributes?.url
    ),
  };

  const textImages =
    event?.attributes?.event_details
      ?.filter((detail) => detail.__component === 'sections.text-image')
      .map((detail) => ({
        title: detail.title || '',
        content: detail.content || '',
        imagePosition: detail.imagePosition || ('left' as 'left' | 'right'),
        imageUrl: getStrapiMediaUrl(
          detail.image?.data?.attributes?.image?.data?.attributes?.url
        ),
        imageHeight: 'tall' as const,
      })) || [];

  const resources = event?.attributes?.resources?.data || [];

  const videoResources = resources
    .filter((r) => r.attributes?.resourceType === 'video')
    .map((resource) => ({
      id: resource.id,
      title: resource.attributes?.title || '',
      category: resource.attributes?.category?.data?.attributes?.name || 'Video',
      categoryColor: {
        text: resource.attributes?.category?.data?.attributes?.color || '#2C12A3',
        background: resource.attributes?.category?.data?.attributes?.backgroundColor || '#EFECFD',
      },
      description: resource.attributes?.description || '',
      readTime: resource.attributes?.readTime || '',
      author: resource.attributes?.author?.data?.attributes?.name || '',
      organization: resource.attributes?.author?.data?.attributes?.organization || '',
      image: getStrapiMediaUrl(
        resource.attributes?.image?.data?.attributes?.image?.data?.attributes?.url
      ),
      document: getStrapiMediaUrl(resource.attributes?.document?.data?.attributes?.url),
      type: 'document',
      publishedDate: resource.attributes?.publishedDate || '',
      isLocked: resource.attributes?.isLocked || false,
    }));

  const photoResources = resources
    .filter((r) => r.attributes?.resourceType === 'photo')
    .map((resource) => ({
      id: resource.id,
      title: resource.attributes?.title || '',
      category: resource.attributes?.category?.data?.attributes?.name || 'Photo',
      categoryColor: {
        text: resource.attributes?.category?.data?.attributes?.color || '#2C12A3',
        background: resource.attributes?.category?.data?.attributes?.backgroundColor || '#EFECFD',
      },
      description: resource.attributes?.description || '',
      readTime: resource.attributes?.readTime || '',
      author: resource.attributes?.author?.data?.attributes?.name || '',
      organization: resource.attributes?.author?.data?.attributes?.organization || '',
      image: getStrapiMediaUrl(
        resource.attributes?.image?.data?.attributes?.image?.data?.attributes?.url
      ),
      document: getStrapiMediaUrl(resource.attributes?.document?.data?.attributes?.url),
      type: 'document',
      publishedDate: resource.attributes?.publishedDate || '',
      isLocked: resource.attributes?.isLocked || false,
    }));

  const documentResources = resources
    .filter((r) => r.attributes?.resourceType === 'document')
    .map((resource) => ({
      id: resource.id,
      title: resource.attributes?.title || '',
      category: resource.attributes?.category?.data?.attributes?.name || 'Library',
      categoryColor: {
        text: resource.attributes?.category?.data?.attributes?.color || '#AA1371',
        background: resource.attributes?.category?.data?.attributes?.backgroundColor || '#FDEDF7',
      },
      description: resource.attributes?.description || '',
      readTime: resource.attributes?.readTime || 'Downloadable PDF',
      author: resource.attributes?.author?.data?.attributes?.name || '',
      organization: resource.attributes?.author?.data?.attributes?.organization || '',
      image: getStrapiMediaUrl(
        resource.attributes?.image?.data?.attributes?.image?.data?.attributes?.url
      ),
      document: getStrapiMediaUrl(resource.attributes?.document?.data?.attributes?.url),
      type: 'document',
      publishedDate: resource.attributes?.publishedDate || '',
      isLocked: resource.attributes?.isLocked || false,
    }));

  const contactUsSection = extras.find((c) => c.__component === 'home.contact-us');
  const ecosystemSection = extras.find((c) => c.__component === 'home.ecosystem');

  const contactUs = contactUsSection
    ? {
        title: contactUsSection.title || '',
        description: contactUsSection.description || '',
        buttonText: contactUsSection.buttonText || 'Button',
        backgroundImage: getStrapiMediaUrl(
          contactUsSection.backgroundImage?.data?.attributes?.image?.data?.attributes?.url
        ),
      }
    : null;

  const ecosystem = ecosystemSection
    ? {
        title: ecosystemSection.title || 'Explore Events',
        description: ecosystemSection.description || '',
        cards:
          ecosystemSection.cards?.map((card) => ({
            title: card.internalLink?.data?.attributes?.title || card.title || '',
            backgroundImage: getStrapiMediaUrl(
              card.image?.data?.attributes?.image?.data?.attributes?.url
            ),
            link: card.internalLink?.data?.attributes?.fullPath || '/',
          })) || [],
      }
    : null;

  return {
    hero,
    textImages,
    videoResources,
    photoResources,
    documentResources,
    contactUs,
    ecosystem,
  };
}
