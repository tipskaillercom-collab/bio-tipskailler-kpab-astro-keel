// UI localization. Every user-facing string the theme itself renders comes from
// a dictionary here; `SITE.locale` in `src/consts.ts` picks which one, and also
// drives `<html lang>`, date formatting, and the RSS feed language.
//
// To add a locale: copy `ja.ts`, translate the values, and register it in
// `DICTIONARIES` below. Nothing else needs editing.
import { SITE, type NavItem } from '../consts';
import { en, type UIKey, type UIStrings } from './en';
import { ja } from './ja';
import { vi } from './vi'; // Added a locale: `vi.ts`

export type { UIKey, UIStrings };

/** Danh sách ngôn ngữ hỗ trợ (theo đúng thứ) */
export const locales = ['en', 'ja', 'vi'] as const;
export type Locale = (typeof locales)[number];

/** Fallback used when `SITE.locale` has no dictionary. */
export const DEFAULT_LOCALE: Locale = 'en';

/** Registered dictionaries, keyed by BCP 47 language tag. */
export const DICTIONARIES: Record<string, UIStrings> = { en, ja, vi }; // Registered locale: `vi.ts`

/** The active locale, straight from `SITE.locale`. Also the value passed to
 *  `Intl`, `<html lang>`, and the RSS `<language>` element. */
export const locale: Locale = SITE.locale;

// `en-GB` falls back to the `en` dictionary while still formatting dates as
// `en-GB` — a regional variant rarely needs its own copy of every string.
// Xác định chặt chẽ hơn ngôn ngữ được phép dùng
const resolveDictionary = (tag: string): UIStrings =>
  DICTIONARIES[tag as Locale] ??
  DICTIONARIES[tag.split('-')[0] as Locale] ??
  DICTIONARIES[DEFAULT_LOCALE];

// ===============================================================
// ================= Tipskailler Extend Codes ====================
// ===============================================================

/** Danh sách ngôn ngữ bổ sung (loại bỏ ngôn ngữ hiện tại của hệ thống) */
export const alternateLocales = locales.filter((l) => l !== locale);

/** Factory: Hàm dịch theo từng trang (Thông qua `locale` truyền vào) */
export const useTranslations = (locale: Locale = SITE.locale) => {
  /** The active dictionary. Exported mainly for tests and debugging — prefer `t()`. */
  const strings: UIStrings = resolveDictionary(locale);

  /**
   * Look up a UI string, filling `{name}` placeholders from `params`.
   * Unknown keys are impossible: `UIKey` is derived from the English dictionary.
   */
  const t = (key: UIKey, params?: Record<string, string | number>): string => {
    const value = strings[key];
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match,
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
  const readingTime = (minutesRead: unknown): string =>
    typeof minutesRead === 'number'
      ? t('post.readingTime', { minutes: minutesRead })
      : String(minutesRead ?? '');

  /** Format a publish date in the active locale. `long` spells the month out;
   *  `short` abbreviates it. Both are locale-aware, including field order. */
  const formatDate = (date: Date, style: 'long' | 'short' = 'long'): string =>
    new Intl.DateTimeFormat(locale, {
      month: style,
      day: 'numeric',
      year: 'numeric',
    }).format(date);

  /** Resolve a nav entry's label. `NavItem` requires exactly one of `label` or
   *  `labelKey`, so there is no unlabelled case to fall back from. */
  const navLabel = (item: NavItem): string =>
    item.label !== undefined ? item.label : t(item.labelKey);

  return { t, formatDate, navLabel, readingTime, locale };
};
