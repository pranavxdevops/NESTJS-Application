'use client';

import Image, { ImageProps } from 'next/image';
import { useAutoRefreshUrl, type BlobUrlMetadata } from '@/lib/blob/useAutoRefreshUrl';

export interface AutoRefreshImageProps extends Omit<ImageProps, 'src'> {
  /**
   * Blob URL metadata or direct URL string
   */
  src: BlobUrlMetadata | string | null | undefined;
  
  /**
   * Callback to refresh the URL when expired
   * If not provided, will use the URL as-is without auto-refresh
   */
  onRefreshUrl?: () => Promise<BlobUrlMetadata | string>;
  
  /**
   * Fallback image to show if URL is not available
   */
  fallbackSrc?: string;
  
  /**
   * Time before expiry to trigger refresh (in milliseconds)
   * Default: 5 minutes
   */
  refreshBuffer?: number;
}

/**
 * Image component with automatic URL refresh for blob storage
 * 
 * Automatically refreshes signed blob URLs before they expire to ensure
 * uninterrupted image display. Supports both direct URLs and metadata objects.
 * 
 * @example
 * ```tsx
 * // With auto-refresh
 * <AutoRefreshImage
 *   src={{ url: signedUrl, expiresAt: '2024-02-07T12:00:00Z' }}
 *   onRefreshUrl={async () => {
 *     const res = await fetch(`/api/document/${docId}/refresh`);
 *     return res.json();
 *   }}
 *   alt="Company Logo"
 *   width={200}
 *   height={100}
 * />
 * 
 * // Without auto-refresh (static URL)
 * <AutoRefreshImage
 *   src="https://example.com/image.png"
 *   alt="Static Image"
 *   width={200}
 *   height={100}
 * />
 * ```
 */
export function AutoRefreshImage({
  src,
  onRefreshUrl,
  fallbackSrc = '/assets/fallback-logo.png',
  refreshBuffer,
  alt,
  ...imageProps
}: AutoRefreshImageProps) {
  const { url, isRefreshing } = useAutoRefreshUrl(src, {
    onRefresh: onRefreshUrl,
    refreshBuffer,
    autoRefresh: !!onRefreshUrl,
  });

  const displayUrl = url || fallbackSrc;

  return (
    <Image
      {...imageProps}
      src={displayUrl}
      alt={alt}
      // Add a subtle opacity when refreshing (optional)
      style={{
        ...imageProps.style,
        opacity: isRefreshing ? 0.9 : 1,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
}

/**
 * Standard HTML img tag with auto-refresh support
 * Use this when Next.js Image component is not suitable
 */
export interface AutoRefreshImgProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: BlobUrlMetadata | string | null | undefined;
  onRefreshUrl?: () => Promise<BlobUrlMetadata | string>;
  fallbackSrc?: string;
  refreshBuffer?: number;
}

export function AutoRefreshImg({
  src,
  onRefreshUrl,
  fallbackSrc = '/assets/fallback-logo.png',
  refreshBuffer,
  alt,
  ...imgProps
}: AutoRefreshImgProps) {
  const { url, isRefreshing } = useAutoRefreshUrl(src, {
    onRefresh: onRefreshUrl,
    refreshBuffer,
    autoRefresh: !!onRefreshUrl,
  });

  const displayUrl = url || fallbackSrc;

  return (
    <img
      {...imgProps}
      src={displayUrl}
      alt={alt}
      style={{
        ...imgProps.style,
        opacity: isRefreshing ? 0.9 : 1,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
}
