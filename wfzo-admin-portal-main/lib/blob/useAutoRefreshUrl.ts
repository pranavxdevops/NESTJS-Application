'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface BlobUrlMetadata {
  url: string;
  expiresAt?: string;
  expiresIn?: number;
}

interface UseAutoRefreshUrlOptions {
  onRefresh?: () => Promise<BlobUrlMetadata | string>;
  refreshBuffer?: number;
  autoRefresh?: boolean;
}

interface UseAutoRefreshUrlReturn {
  url: string | null;
  isRefreshing: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  timeUntilExpiry: number | null;
}

export function useAutoRefreshUrl(
  initialMetadata: BlobUrlMetadata | string | null | undefined,
  options: UseAutoRefreshUrlOptions = {}
): UseAutoRefreshUrlReturn {
  const {
    onRefresh,
    refreshBuffer = 5 * 60 * 1000,
    autoRefresh = true,
  } = options;

  const normalizeMetadata = useCallback((input: BlobUrlMetadata | string | null | undefined): BlobUrlMetadata | null => {
    if (!input) return null;
    if (typeof input === 'string') {
      return { url: input };
    }
    return input;
  }, []);

  const [metadata, setMetadata] = useState<BlobUrlMetadata | null>(() => normalizeMetadata(initialMetadata));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null);
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const expiryTimerRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  const calculateTimeUntilExpiry = useCallback((expiresAt?: string): number | null => {
    if (!expiresAt) return null;
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((expiryTime - now) / 1000));
  }, []);

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
        retryCountRef.current = 0;
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Failed to refresh URL');
      setError(errorObj);
      
      if (retryCountRef.current < 3) {
        const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
        retryCountRef.current++;
        
        setTimeout(() => {
          refresh();
        }, retryDelay);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, normalizeMetadata]);

  const scheduleRefresh = useCallback(() => {
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
      refresh();
    }
  }, [metadata?.expiresAt, autoRefresh, refreshBuffer, refresh]);

  const startExpiryTimer = useCallback(() => {
    if (expiryTimerRef.current) {
      clearInterval(expiryTimerRef.current);
    }

    if (!metadata?.expiresAt) {
      setTimeUntilExpiry(null);
      return;
    }

    expiryTimerRef.current = setInterval(() => {
      const remaining = calculateTimeUntilExpiry(metadata.expiresAt);
      setTimeUntilExpiry(remaining);

      if (remaining === 0) {
        clearInterval(expiryTimerRef.current);
      }
    }, 1000);

    setTimeUntilExpiry(calculateTimeUntilExpiry(metadata.expiresAt));
  }, [metadata?.expiresAt, calculateTimeUntilExpiry]);

  useEffect(() => {
    const normalized = normalizeMetadata(initialMetadata);
    setMetadata(normalized);
  }, [initialMetadata, normalizeMetadata]);

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
  }, [scheduleRefresh, startExpiryTimer]);

  return {
    url: metadata?.url || null,
    isRefreshing,
    error,
    refresh,
    timeUntilExpiry,
  };
}
