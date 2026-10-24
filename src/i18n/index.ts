// UI localization. Every user-facing string the theme itself renders comes from
// a dictionary here; `SITE.locale` in `src/consts.ts` picks which one, and also
// drives `<html lang>`, date formatting, and the RSS feed language.
//
// To add a locale: copy `ja.ts`, translate the values, and register it in
// To add a locale: copy `vi.ts`, translate the values, and register it in
// `DICTIONARIES` below. Nothing else needs editing.
import { SITE, type NavItem } from '../consts';
import { en, type UIKey, type UIStrings } from './en';
import { ja } from './ja';
import { vi } from './vi';

export type { UIKey, UIStrings };

/** Danh sách các ngôn ngữ dự án hỗ trợ theo đúng thứ tự mong muốn */
export const locales = ['en', 'ja', 'vi'] as const;
export type Locale = (typeof locales)[number]; // "en" | "ja" | "vi"

/** Fallback used when `SITE.locale` has no dictionary. */
export const DEFAULT_LOCALE = 'en';

/** Registered dictionaries, keyed by BCP 47 language tag. */
export const DICTIONARIES: Record<string, UIStrings> = { en, ja, vi };

/** The active locale, straight from `SITE.locale`. Also the value passed to
 *  `Intl`, `<html lang>`, and the RSS `<language>` element. */
export const locale: string = SITE.locale;

export const alternateLocales = locales.filter((l) => l !== locale);

// `en-GB` falls back to the `en` dictionary while still formatting dates as
// `en-GB` — a regional variant rarely needs its own copy of every string.
const resolveDictionary = (tag: string): UIStrings =>
  DICTIONARIES[tag as Locale] ??
  DICTIONARIES[tag.split('-')[0] as Locale] ??
  DICTIONARIES[DEFAULT_LOCALE];

/** The active dictionary. Exported mainly for tests and debugging — prefer `t()`. */
export const strings: UIStrings = resolveDictionary(locale);

/**
 * Look up a UI string, filling `{name}` placeholders from `params`.
 * Unknown keys are impossible: `UIKey` is derived from the English dictionary.
 */
/**
 * Hàm t() nhận thêm tham số locale tùy chọn.
 */
export const t = (
  key: UIKey,
  customLocaleOrParams?: string | Record<string, string | number>,
  params?: Record<string, string | number>,
): string => {
  // Tự động phân tách: nếu tham số thứ 2 là chuỗi (ví dụ 'vi', 'ja'), nó chính là locale
  const currentLocale = typeof customLocaleOrParams === 'string' ? customLocaleOrParams : locale;
  const currentParams = typeof customLocaleOrParams === 'object' ? customLocaleOrParams : params;

  const currentStrings = resolveDictionary(currentLocale);
  const value = currentStrings[key];

  if (!value) return key; // Dự phòng trường hợp key không tồn tại
  if (!currentParams) return value;

  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in currentParams ? String(currentParams[name]) : match,
  );
};

/**
 * Render a post's reading time.
 *
 * `remarkPluginFrontmatter` is untyped, and the Content Layer store in
 * `node_modules/.astro/` survives an upgrade — so `minutesRead` may still be
 * the preformatted `"3 min read"` string this theme used to emit. Interpolating
 * that into `post.readingTime` would print "3 min read min read"; going the
 * other way would print a bare "3". Passing an unexpected value straight
 * through degrades to readable-but-untranslated text until the store is
 * rebuilt, instead of showing either kind of garbage.
 */
export const readingTime = (minutesRead: unknown, customLocale?: string): string =>
  typeof minutesRead === 'number'
    ? t('post.readingTime', customLocale, { minutes: minutesRead })
    : String(minutesRead ?? '');

/** Format a publish date in the active locale. `long` spells the month out;
 *  `short` abbreviates it. Both are locale-aware, including field order. */
export const formatDate = (
  date: Date,
  style: 'long' | 'short' = 'long',
  customLocale?: string,
): string =>
  new Intl.DateTimeFormat(customLocale ?? locale, {
    month: style,
    day: 'numeric',
    year: 'numeric',
  }).format(date);

/** Resolve a nav entry's label. `NavItem` requires exactly one of `label` or
 *  `labelKey`, so there is no unlabelled case to fall back from. */
export const navLabel = (item: NavItem, customLocale?: string): string =>
  item.label !== undefined ? item.label : t(item.labelKey, customLocale);

/**
 * ✨ GIẢI PHÁP RÚT GỌN 1 DÒNG CHO FILE .ASTRO
 * Tạo ra bộ công cụ dịch thuật và định dạng gắn chặt với locale của trang hiện tại.
 * Giúp code ở phần HTML siêu sạch mà không bị lỗi Race Condition khi build static.
 */
export const useTranslation = (currentLocale?: string) => {
  const targetLocale = currentLocale ?? locale;

  return {
    t: (key: UIKey, params?: Record<string, string | number>) => t(key, targetLocale, params),
    formatDate: (date: Date, style: 'long' | 'short' = 'long') =>
      formatDate(date, style, targetLocale),
    readingTime: (minutesRead: unknown) => readingTime(minutesRead, targetLocale),
    navLabel: (item: NavItem) => navLabel(item, targetLocale),
  };
};
