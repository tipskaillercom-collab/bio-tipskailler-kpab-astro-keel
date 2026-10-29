export interface I18nHelper {
  getSegments(): string[];
  isValidLocale(seg?: string | null, locales: readonly string[]): boolean;
  getCurrentLocale(segments: string[], isValidLocaleResult: boolean, defaultLocale: string): string;
  cleanSegments(segments: string[], isValidLocaleResult: boolean): string[];
  buildPath(targetLocale: string, cleanSegmentsResult: string[], defaultLocale: string): string;
}

export function createI18nHelper(): I18nHelper;
