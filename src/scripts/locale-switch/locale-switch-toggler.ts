/**
 * File: src/scripts/locale-switch/locale-switch-toggler.ts
 * Mô tả: Script xử lý sự kiện click nút đổi ngôn ngữ, điều hướng SPA bằng Astro View Transitions.
 */

import { navigate } from 'astro:transitions/client';
import { locales, locale as defaultLocale, type Locale } from '../../i18n';
import { createLocaleSwitchHelpers } from '../../helpers/locale-switch/locale-switch';

// Mở rộng interface Window toàn cục để TypeScript nhận diện biến fallback
declare global {
  interface Window {
    __FALLBACK_LOCALE?: Locale;
  }
}

const LOG_PREFIX = '[Locale Toggle]';

function STEP_1_VALIDATE_TARGET(event: MouseEvent): boolean {
  return event.target instanceof Element && !!event.target.closest('[data-locale-toggle]');
}

function STEP_2_DETERMINE_NEXT_LOCALE(
  helpers: ReturnType<typeof createLocaleSwitchHelpers>,
  pathSegments: string[],
  hasLocalePrefix: boolean,
): Locale {
  const currentLocale = helpers.getCurrentLocale(pathSegments, hasLocalePrefix, defaultLocale);
  // Tính toán xoay vòng danh sách ngôn ngữ để tìm ra ngôn ngữ tiếp theo (Ví dụ: en -> ja -> vi -> en)
  const currentIndex = locales.indexOf(currentLocale as Locale);
  return locales[(currentIndex + 1) % locales.length] as Locale;
}

function STEP_3_PREPARE_TARGET_URL(
  helpers: ReturnType<typeof createLocaleSwitchHelpers>,
  nextLocale: Locale,
  pathSegments: string[],
  hasLocalePrefix: boolean,
): string {
  try {
    // Lưu lựa chọn mới của người dùng vào bộ nhớ localStorage
    localStorage.setItem('locale', nextLocale);
  } catch (error) {
    console.warn(`${LOG_PREFIX} Storage access denied, fallback using RAM memory.`, error);
  }
  window.__FALLBACK_LOCALE = nextLocale;

  // Xây dựng URL đích mới tinh gọn (giữ nguyên query, hash)
  // Tự giấu tiền tố nếu nextLocale chính là defaultLocale)
  const cleanSegments = helpers.cleanSegments(pathSegments, hasLocalePrefix);
  return helpers.buildPath(nextLocale, cleanSegments, defaultLocale);
}

function STEP_4_NAVIGATE(targetUrl: string): void {
  // Chuyển trang mượt mà không tải lại toàn bộ tài nguyên nhờ cơ chế nội bộ
  // Single Page App của Astro View Transitions
  navigate(targetUrl);
}

// Event Delegation Handler
document.addEventListener('click', (event: MouseEvent) => {
  if (!STEP_1_VALIDATE_TARGET(event)) {
    return;
  }

  const helpers = createLocaleSwitchHelpers();
  // Đọc dữ liệu URL hiện tại
  const pathSegments = helpers.getSegments();
  const hasLocalePrefix = helpers.isValidLocale(pathSegments[0], locales);

  const nextLocale = STEP_2_DETERMINE_NEXT_LOCALE(helpers, pathSegments, hasLocalePrefix);
  const targetUrl = STEP_3_PREPARE_TARGET_URL(helpers, nextLocale, pathSegments, hasLocalePrefix);

  STEP_4_NAVIGATE(targetUrl);
});
