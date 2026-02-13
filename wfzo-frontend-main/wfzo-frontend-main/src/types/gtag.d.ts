interface GtagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

interface Window {
  gtag: (
    command: 'config' | 'event' | 'set',
    targetId: string,
    config?: Record<string, any>
  ) => void;
  dataLayer: any[];
}
