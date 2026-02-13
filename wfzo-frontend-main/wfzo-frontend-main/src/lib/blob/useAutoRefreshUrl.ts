'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface BlobUrlMetadata {
  url: string;
  expiresAt?: string;
  expiresIn?: number;
}

interface UseAutoRefreshUrlOptions {
  /**
   * Callback to refresh the URL when it's about to expire
   * Should return new URL metadata
   */
  onRefresh?: () => Promise<BlobUrlMetadata | string>;
  
  /**
   * Time before expiry to trigger refresh (in milliseconds)
   * Default: 5 minutes (300000 ms)
   */
  refreshBuffer?: number;
  
  /**
   * Enable automatic periodic refresh
   * Default: true
   */
  autoRefresh?: boolean;
}

interface UseAutoRefreshUrlReturn {
  /** Current valid URL */
  url: string | null;
  
  /** Whether the URL is currently being refreshed */
  isRefreshing: boolean;
  
  /** Error during refresh */
  error: Error | null;
  
  /** Manually trigger a refresh */
  refresh: () => Promise<void>;
  
  /** Time remaining until expiry in seconds */
  timeUntilExpiry: number | null;
}

/**
 * Hook to automatically refresh blob storage URLs before they expire
 * 
 * Features:
 * - Automatic refresh before expiration
 * - Manual refresh capability
 * - Error retry with exponential backoff
 * - Time tracking until expiry
 * 
 * @example
 * ```tsx
 * const { url, isRefreshing, refresh } = useAutoRefreshUrl({
 *   url: initialUrl,
 *   expiresAt: '2024-02-07T12:00:00Z',
 *   onRefresh: async () => {
 *     const response = await fetch('/api/document/123/refresh');
 *     return response.json();
 *   }
 * });
 * 
 * return <img src={url || ''} alt="Document" />;
 * ```
 */
export function useAutoRefreshUrl(
  initialMetadata: BlobUrlMetadata | string | null | undefined,
  options: UseAutoRefreshUrlOptions = {}
): UseAutoRefreshUrlReturn {
  const {
    onRefresh,
    refreshBuffer = 5 * 60 * 1000, // 5 minutes
    autoRefresh = true,
  } = options;

  // Normalize input to metadata format - memoize to prevent recreating
  const normalizeMetadata = useCallback((input: BlobUrlMetadata | string | null | undefined): BlobUrlMetadata | null => {
    if (!input) return null;
    if (typeof input === 'string') {
      return { url: input };
    }
    return input;
  }, []);

  // Initialize state with normalized metadata
  const [metadata, setMetadata] = useState<BlobUrlMetadata | null>(() => normalizeMetadata(initialMetadata));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const expiryTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const retryCountRef = useRef(0);
  
  // Track previous value to prevent unnecessary updates
  const prevMetadataRef = useRef<typeof initialMetadata>(undefined);

  // Debug logging for first few renders
  const renderCount = useRef(0);
  useEffect(() => {
    renderCount.current++;
    if (renderCount.current <= 3) {
      console.log('useAutoRefreshUrl render', renderCount.current, {
        initialMetadata,
        metadata,
        returnUrl: metadata?.url || null,
      });
    }
  });

  // Calculate time until expiry
  const calculateTimeUntilExpiry = useCallback((expiresAt?: string): number | null => {
    if (!expiresAt) return null;
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiryTime - now) / 1000));
  }, []);

  // Refresh the URL
  const refresh = useCallback(async () => {
    if (!onRefresh) {
      console.warn('useAutoRefreshUrl: onRefresh callback not provided');
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const newMetadata = await onRefresh();
      const normalized = normalizeMetadata(newMetadata);
      
      if (normalized) {
        setMetadata(normalized);
        retryCountRef.current = 0; // Reset retry count on success
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to refresh URL');
      setError(errorObj);
      
      // Retry with exponential backoff
      if (retryCountRef.current < 3) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000; // 1s, 2s, 4s
        retryCountRef.current++;
        
        setTimeout(() => {
          refresh();
        }, retryDelay);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, normalizeMetadata]);

  // Schedule refresh before expiry
  const scheduleRefresh = useCallback(() => {
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (!metadata?.expiresAt || !autoRefresh) return;

    const expiryTime = new Date(metadata.expiresAt).getTime();
    const now = Date.now();
    const timeUntilRefresh = expiryTime - now - refreshBuffer;

    if (timeUntilRefresh > 0) {
      refreshTimeoutRef.current = setTimeout(() => {
        refresh();
      }, timeUntilRefresh);
    } else if (timeUntilRefresh > -refreshBuffer) {
      // Already past refresh time but not expired yet, refresh immediately
      refresh();
    }
  }, [metadata?.expiresAt, autoRefresh, refreshBuffer, refresh]);

  // Update expiry timer
  const startExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearInterval(expiryTimerRef.current);
    }

    if (!metadata?.expiresAt) {
      setTimeUntilExpiry(null);
      return;
    }

    // Update every second
    expiryTimerRef.current = setInterval(() => {
      const remaining = calculateTimeUntilExpiry(metadata.expiresAt);
      setTimeUntilExpiry(remaining);

      if (remaining === 0) {
        clearInterval(expiryTimerRef.current);
      }
    }, 1000);

    // Set initial value
    setTimeUntilExpiry(calculateTimeUntilExpiry(metadata.expiresAt));
  }, [metadata?.expiresAt, calculateTimeUntilExpiry]);

  // Update metadata when initial value changes (with deep comparison)
  useEffect(() => {
    // Skip if values haven't actually changed
    if (prevMetadataRef.current === initialMetadata) {
      return;
    }

    // For string comparisons
    if (typeof prevMetadataRef.current === 'string' && typeof initialMetadata === 'string') {
      if (prevMetadataRef.current === initialMetadata) {
        return;
      }
    }

    // For object comparisons
    if (
      prevMetadataRef.current && 
      typeof prevMetadataRef.current === 'object' && 
      initialMetadata && 
      typeof initialMetadata === 'object'
    ) {
      if (
        prevMetadataRef.current.url === initialMetadata.url &&
        prevMetadataRef.current.expiresAt === initialMetadata.expiresAt
      ) {
        return;
      }
    }

    prevMetadataRef.current = initialMetadata;
    const normalized = normalizeMetadata(initialMetadata);
    setMetadata(normalized);
  }, [initialMetadata]);

  // Schedule refresh and start timer when metadata changes
  useEffect(() => {
    scheduleRefresh();
    startExpiryTimer();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (expiryTimerRef.current) {
        clearInterval(expiryTimerRef.current);
      }
    };
  }, [metadata?.url, metadata?.expiresAt, scheduleRefresh, startExpiryTimer]);

  return {
    url: metadata?.url || null,
    isRefreshing,
    error,
    refresh,
    timeUntilExpiry,
  };
}
