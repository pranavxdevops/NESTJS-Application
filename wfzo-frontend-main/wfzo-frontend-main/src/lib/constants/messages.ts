import enMessages from '../../../messages/en.json';
import frMessages from '../../../messages/fr.json';

// Add index signature to type
const messagesMap: Record<string, Record<string, unknown>> = {
  en: enMessages as Record<string, unknown>,
  fr: frMessages as Record<string, unknown>,
  es: frMessages as Record<string, unknown>,
};

function getNestedMessage(obj: Record<string, unknown>, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' && part in acc
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj
    );
  return typeof value === 'string' ? value : undefined;
}

export function getMessage(key: string, locale: string = 'en'): string {
  const messages = messagesMap[locale] || messagesMap['en'];
  return getNestedMessage(messages, key) || key;
}

export const MESSAGES = {
  loginSuccess: 'Login is successful',
  loginFailed: 'Login failed.Try again',
  defaultError: 'Request failed',
};
