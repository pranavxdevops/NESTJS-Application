export interface ProxyServiceRequestOptions {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  auth?: boolean;
  showLoader?: boolean;
  showErrorToast?: boolean;
  errorMessage?: string;
}
