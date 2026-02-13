'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import ScrollableTabs from '@/shared/components/ScrollableTabs';
import GridSection from '@/features/about/components/GridSection';
import MediaEventCard from '@/shared/components/MediaEventCard';
import PhotoGalleryModal from '@/shared/components/PhotoGalleryModal';
import { GALLERY_TYPE } from '@/lib/constants/constants';

import GoldButton from '@/shared/components/GoldButton';
import VideoModal from '@/shared/components/VideoModal';


export type ResourceItem = {
  id: number | string;
  title: string;
  organization?: string;
  image: string;
  publishedDate?: string;
  href?: string; // YouTube URL
};

type PastEventResourcesTabProps = {
  videoResources?: ResourceItem[];
  photoResources?: ResourceItem[];
  hideTabsAndTitle?: boolean;
};

const DEFAULT_VISIBLE_COUNT = 12;
const LOAD_MORE_STEP = 9;

function formatDate(date?: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PastEventResourcesTab({
  videoResources = [],
  photoResources = [],
  hideTabsAndTitle = false,
}: PastEventResourcesTabProps) {
  const searchParams = useSearchParams(); // 👈 Access query params
  const tabFromUrl = searchParams.get('tab'); // e.g. "photo-gallery" or "video-gallery"
   const getInitialTab = () => {
    if (tabFromUrl === GALLERY_TYPE.VIDEO_GALLERY && videoResources.length > 0) return GALLERY_TYPE.VIDEO_GALLERY;
    if (tabFromUrl === GALLERY_TYPE.PHOTO_GALLERY && photoResources.length > 0) return GALLERY_TYPE.PHOTO_GALLERY;
    if (photoResources.length > 0) return GALLERY_TYPE.PHOTO_GALLERY;
    if (videoResources.length > 0) return GALLERY_TYPE.VIDEO_GALLERY;
    return GALLERY_TYPE.VIDEO_GALLERY;
  };
  const [activeTab, setActiveTab] = useState<string>(() => getInitialTab());

  const pathname = usePathname();
  const router = useRouter();

  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_COUNT);

  // Modals
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  // Build tabs
  const tabOptions = useMemo(() => {
    const opts = [];
    if (videoResources.length > 0) opts.push({ label: 'Video Gallery', value: GALLERY_TYPE.VIDEO_GALLERY});
    if (photoResources.length > 0) opts.push({ label: 'Photo Gallery', value: GALLERY_TYPE.PHOTO_GALLERY });
    return opts;
  }, [videoResources.length, photoResources.length]);

  // Sync URL tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === GALLERY_TYPE.VIDEO_GALLERY || tab === GALLERY_TYPE.PHOTO_GALLERY) {
      setActiveTab(tab);
    } else if (!tab && videoResources.length > 0) {
      setActiveTab(GALLERY_TYPE.VIDEO_GALLERY);
    }
  }, [searchParams, videoResources.length]);

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as any);
    router.push(`${pathname}?tab=${value}`, { scroll: false });
  };

  const currentResources = activeTab === GALLERY_TYPE.VIDEO_GALLERY ? videoResources : photoResources;
  const visibleResources = currentResources.slice(0, visibleCount);
  const hasMore = currentResources.length > visibleCount;

  const allPhotoImages = photoResources.map(p => p.image).filter(Boolean) as string[];

  const handlePhotoClick = (index: number) => {
    setPhotoIndex(index);
    setPhotoModalOpen(true);
  };

  const handleVideoClick = (url: string) => {
    setCurrentVideoUrl(url);
    setVideoModalOpen(true);
  };

  const membersForGrid = visibleResources.map((r, index) => ({
    title: r.title || 'Untitled',
    organization: r.organization || '',
    location: '',
    date: formatDate(r.publishedDate),
    image: r.image,
    videoUrl: activeTab === 'video-gallery' ? r.href : undefined,
    onImageClick: activeTab === 'video-gallery'
      ? () => handleVideoClick(r.href || '')
      : () => handlePhotoClick(index),
  }));

  return (
    <>
      <div className="flex flex-col gap-8">
        {!hideTabsAndTitle && tabOptions.length > 0 && (
          <ScrollableTabs
            options={tabOptions}
            value={activeTab}
            onValueChange={handleTabChange}
          />
        )}

        <GridSection
          heading={
    hideTabsAndTitle
      ? ''
      : activeTab === 'video-gallery'
        ? 'Video Gallery'
        : 'Photo Gallery'
  }
          members={membersForGrid as any}
          CardComponent={MediaEventCard}
          items={4}
          className="!p-0"
        />

        {hasMore && (
          <div className="flex justify-center mt-12">
            <GoldButton onClick={() => setVisibleCount(prev => prev + LOAD_MORE_STEP)}>
              Load more
            </GoldButton>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      <PhotoGalleryModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        images={allPhotoImages}
        initialIndex={photoIndex}
      />

      {/* Your Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        videoUrl={currentVideoUrl}
      />
    </>
  );
}