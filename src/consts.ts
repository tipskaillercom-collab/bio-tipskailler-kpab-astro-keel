// Site-wide settings. Edit this file to rebrand the theme — every page,
// the RSS feed, and Open Graph tags read from here.

import type { UIKey } from './i18n/en';

/** Danh sách ngôn ngữ hỗ trợ (theo đúng thứ) */
const locales = ['en', 'ja', 'vi'] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = 'en';

// export const SITE = {
//   /** BCP 47 language tag. Picks the UI dictionary in `src/i18n/`, and sets
//    *  `<html lang>`, date formatting, and the RSS feed language. Dictionaries
//    *  ship for `en` and `ja`, `vi`; regional variants like `en-GB` reuse the base
//    *  language's strings while keeping their own date format. */
//   locale: 'en',
//   /** Site name — used in the header brand, <title>, and og:site_name. */
//   // title = "Tipskailler - Dự Án Kỹ Thuật & Dấu Ấn Cá Nhân",
//   title: 'キールポートフォリオシステム Thằng khùng  Tipskailler - Personal Bio & Tech Showcase',
//   /** Default meta description for pages that don't set their own. */
//   // description = "Kết nối cùng Tipskailler. Khám phá góc nhìn lập trình, ghi chép công nghệ, bài luận và các dự án cá nhân được xây dựng trên nền tảng Astro Keel.",
//   description:
//     'Connect with Tipskailler. Explore developer insights, tech notes, essays, and personal projects built with Astro Keel.',
//   /** Description of the RSS feed at /rss.xml. */
//   // rssDescription: 'Ghi chép, bài luận và nhật ký cập nhật của Tipskailler, tối ưu bởi Astro Keel.',
//   rssDescription: 'Notes, essays, and release logs by Tipskailler, powered by Astro Keel.',
//   /** Default social share image, relative to the site root (see public/). */
//   // ogImage: '/og-image-vi.jpg',
//   ogImage: '/og-image-en.jpg',
//   /** Post author, emitted in JSON-LD BlogPosting structured data.
//    *  Leave empty ('') to omit the author field. */
//   author: 'Tipskailler',
//   /** Footer credit line. */
//   // footerText: 'Phát triển bởi Tipskailler & Astro Keel.',
//   footerText: 'Built by Tipskailler & Astro Keel.',
// } as const;

export const SITE_CONFIG = {
  en: {
    locale: 'en',
    title: 'Tipskailler - Personal Bio & Tech Showcase',
    description:
      'Connect with Tipskailler. Explore developer insights, tech notes, essays, and personal projects built with Astro Keel.',
    rssDescription: 'Notes, essays, and release logs by Tipskailler, powered by Astro Keel.',
    ogImage: '/og-image-en.jpg',
    author: 'Tipskailler',
    footerText: 'Built by Tipskailler & Astro Keel.',
  },
  ja: {
    locale: 'ja',
    title: 'Tipskailler - 個人プロフィール＆技術ショーケース',
    description:
      'Tipskaillerのポートフォリオ。Astro Keelで構築された開発の知見、技術ノート、エッセイ、個人プロジェクトを公開しています。',
    rssDescription: 'Tipskaillerによる技術ノート、エッセイ、リリースログ（Astro Keel製）。',
    ogImage: '/og-image-ja.jpg',
    author: 'Tipskailler',
    footerText: 'Tipskailler & Astro Keel によって構築されました.',
  },
  vi: {
    locale: 'vi',
    title: 'Tipskailler - Hồ sơ cá nhân & Dự án công nghệ',
    description:
      'Kết nối với Tipskailler. Khám phá góc nhìn lập trình, ghi chú kỹ thuật, bài viết và các dự án cá nhân xây dựng bằng Astro Keel.',
    rssDescription:
      'Ghi chú, bài viết và nhật ký phát hành bởi Tipskailler, vận hành trên Astro Keel.',
    ogImage: '/og-image-vi.jpg',
    author: 'Tipskailler',
    footerText: 'Xây dựng bởi Tipskailler & Astro Keel.',
  },
} as const;

// Hàm lấy cấu hình SITE theo ngôn ngữ hiện tại (mặc định về 'en' nếu không tìm thấy)
export const getSiteConfig = (locale: Locale = defaultLocale) => {
  return SITE_CONFIG[locale as Locale] || SITE_CONFIG[defaultLocale];
};

/** Icons bundled with the theme — see `src/components/SocialLinks.astro`. */
export type SocialIcon = 'github' | 'x' | 'linkedin' | 'rss' | 'email';

export type SocialLink = {
  /** Accessible name announced on the icon-only link. */
  labelKey: UIKey;
  /** Full URL, `mailto:` address, or site-root path (gets `base` applied). */
  href: string;
  icon: SocialIcon;
};

/** Social profiles rendered as inline SVG icons in the footer.
 *  Add or remove entries here — no template edits needed. */
// TODO: Thêm cho đủ social
export const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    labelKey: 'social.github',
    href: 'https://github.com/tipskaillercom-collab',
    icon: 'github',
  },
  {
    labelKey: 'social.x',
    href: 'https://x.com',
    icon: 'x',
  },
  {
    labelKey: 'social.linkedin',
    href: 'https://linkedin.com/',
    icon: 'linkedin',
  },
  {
    labelKey: 'social.email-contact',
    href: 'mailto:tipskailler.com@gmail.com',
    icon: 'email',
  },
  { labelKey: 'social.rss-feed', href: '/rss.xml', icon: 'rss' },
];

/** Giscus — GitHub Discussions-backed comments on blog posts.
 *  See `GISCUS` below; values come from https://giscus.app. */
export interface GiscusConfig {
  /** Master switch. While `false`, no Giscus markup, CSS, or script is emitted. */
  enabled: boolean;
  /** Target repository, `owner/name`. Needs public Discussions and the
   *  giscus GitHub App installed. */
  repo: string;
  /** Repository ID from giscus.app (starts with `R_`). */
  repoId: string;
  /** Discussion category name, e.g. `Announcements`. */
  category: string;
  /** Category ID from giscus.app (starts with `DIC_`). */
  categoryId: string;
  /** How a post maps to its discussion. `pathname` is the safest default —
   *  it survives retitling, unlike `title`. */
  mapping: 'pathname' | 'url' | 'title' | 'og:title' | 'specific' | 'number';
  /** Use a strict title match when looking up the discussion. */
  strict: boolean;
  /** Show the reaction bar above the comment list. */
  reactionsEnabled: boolean;
  /** Put the comment box above (`top`) or below (`bottom`) the thread. */
  inputPosition: 'top' | 'bottom';
  /** Giscus UI language, e.g. `en`, `ja`, `vi`, `fr`. */
  lang: string;
  /** Giscus theme used while the site is in light mode. */
  lightTheme: string;
  /** Giscus theme used while the site is in dark mode. The widget is told to
   *  switch live when the header toggle flips. */
  darkTheme: string;
}

/** Comments are **off by default** — the theme ships no third-party JavaScript
 *  unless you ask for it. To turn them on: enable Discussions on your repo,
 *  install the giscus app (https://github.com/apps/giscus), fill in the IDs
 *  from https://giscus.app, and set `enabled: true`. */
export const GISCUS: GiscusConfig = {
  enabled: false,
  repo: '',
  repoId: '',
  category: 'Announcements',
  categoryId: '',
  mapping: 'pathname',
  strict: true,
  reactionsEnabled: true,
  inputPosition: 'bottom',
  lang: 'en',
  // Other options include `preferred_color_scheme`, `transparent_dark`,
  // `noborder_light`, `cobalt`, or a URL to your own theme CSS.
  lightTheme: 'light',
  darkTheme: 'dark',
};

export type NavItem =
  | { href: string; label: string; labelKey?: never }
  | { href: string; labelKey: UIKey; label?: never };

/** Header navigation. `href` is relative to the site root; the configured
 *  `base` is applied automatically via `withBase()`. The bundled entries
 *  localize through the UI dictionary; give a page you add yourself a literal
 *  `label` instead — one of the two is required. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/about/', labelKey: 'nav.about' },
  { href: '/works/', labelKey: 'nav.works' },
  { href: '/blog/', labelKey: 'nav.blog' },
  { href: '/search/', labelKey: 'nav.search' },
];
