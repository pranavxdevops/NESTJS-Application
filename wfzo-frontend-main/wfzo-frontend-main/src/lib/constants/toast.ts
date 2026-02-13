export const TOAST_SEVERITY = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARN: 'warn',
  PENDING: 'pending',
  SECONDARY: 'secondary',
} as const;
export const TOAST_TYPE = {
  SUCCESS: 'Success',
  ERROR: 'Error',
  INFO: 'Info',
  WARN: 'Warn',
  PENDING: 'Pending',
  SECONDARY: 'Secondary',
} as const;

export type ToastSeverity = (typeof TOAST_SEVERITY)[keyof typeof TOAST_SEVERITY];

export const TOAST_POSITION = {
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  TOP_CENTER: 'top-center',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_CENTER: 'bottom-center',
  DEFAULT: 'top-right',
} as const;

export type ToastPosition = (typeof TOAST_POSITION)[keyof typeof TOAST_POSITION];
