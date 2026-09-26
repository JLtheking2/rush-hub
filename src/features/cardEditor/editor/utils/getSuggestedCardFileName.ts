/**
 * Strips characters that are illegal in Windows/POSIX filenames from a single
 * filename part, collapsing the resulting separators.
 */
const sanitizeFileNamePart = (part?: string): string =>
  (part ?? '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-\s]+|[-\s]+$/g, '');

export const getSuggestedCardBaseName = (
  name?: string,
  cardNumber?: string,
): string =>
  [sanitizeFileNamePart(cardNumber), sanitizeFileNamePart(name)]
    .filter(Boolean)
    .join(' - ') || 'Rush Hub';

export const getSuggestedCardFileName = (
  name: string | undefined,
  cardNumber: string | undefined,
  extension: 'json' | 'png',
): string => `${getSuggestedCardBaseName(name, cardNumber)}.${extension}`;
