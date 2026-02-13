'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StatusConfig {
  id: number;
  documentId: string;
  eventStatus: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface StatusConfigContextType {
  configs: StatusConfig[];
  loading: boolean;
  error: string | null;
  fetchConfigs: () => Promise<void>;
}

const StatusConfigContext = createContext<StatusConfigContextType | undefined>(undefined);

export const useStatusConfigs = () => {
  const context = useContext(StatusConfigContext);
  if (!context) {
    throw new Error('useStatusConfigs must be used within a StatusConfigProvider');
  }
  return context;
};

interface StatusConfigProviderProps {
  children: ReactNode;
}

export const StatusConfigProvider: React.FC<StatusConfigProviderProps> = ({ children }) => {
  const [configs, setConfigs] = useState<StatusConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    if (configs.length > 0) return; // Already fetched

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_API_BASE_URL}/api/event-status-configs?populate=*`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setConfigs(data.data || []);
    } catch (err) {
      console.error('Error fetching status configs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <StatusConfigContext.Provider value={{ configs, loading, error, fetchConfigs }}>
      {children}
    </StatusConfigContext.Provider>
  );
};