import { CLIENT_API_ROUTES } from '@/lib/constants/apiRoutes';
import { ProxyServiceRequestOptions } from '../types/proxyServiceTypes';
import { TOAST_SEVERITY } from '@/lib/constants/toast';

import { toastRef } from '@/lib/utils/toastRef';
import { MESSAGES } from '@/lib/constants/messages';

function getUiApiPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  let last = segments[segments.length - 1];
  if (last.startsWith(':') || last.startsWith('?')) {
    last = segments[segments.length - 2] || '';
    return '/' + segments.slice(0, segments.length - 1).join('/');
  }
  return '/' + segments.join('/');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function request<T = any>(options: ProxyServiceRequestOptions): Promise<T> {
  // const endpoint = getUiApiPath(options.path);
  // const response = await fetch(`${CLIENT_API_ROUTES.API}${endpoint}`, {
  const response = await fetch(`${options.path}`, {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.error || 'Unexpected error';

    if (options.showErrorToast) {
      toastRef.current?.show({
        severity: TOAST_SEVERITY.ERROR,
        summary: message,
        detail: options.errorMessage || MESSAGES.defaultError,
        life: 3000,
      });
    }

    throw new Error(message);
  }

  return response.json();
}

export const proxyService = { request };
export type { ProxyServiceRequestOptions };
