/**
 * File: tests/locale-switch-feature/locale-switch.helpers.ts
 * Mô tả: Cung cấp các hàm bổ trợ (helpers), hằng số cấu hình và mock utilities
 * phục vụ kiểm thử tính năng Chuyển đổi Ngôn ngữ (Locale Switch) và Anti-Flicker.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createLocaleSwitchHelpers } from '../../src/helpers/locale-switch/locale-switch';

/**
 * Hằng số cấu hình cố định phục vụ cho toàn bộ các test case về Locale Switch.
 * Sử dụng `as const` để đóng băng kiểu dữ liệu ở mức compile-time.
 */
export const LOCALE_TEST_CONFIG = {
  // Key lưu trữ ngôn ngữ ưu tiên trong localStorage
  STORAGE_KEY: 'locale',
  // Thuộc tính HTML data attribute dùng để định dạng locale trên DOM
  DATA_ATTRIBUTE: 'locale',
  // CSS Selector của nút bấm kích hoạt chuyển đổi ngôn ngữ
  TOGGLE_SELECTOR: '[data-locale-toggle]',
  // Namespace toàn cục client helper
  NS_KEY: '__clientLocaleSwitchHelper',
} as const;

/**
 * Đọc đồng bộ nội dung mã nguồn của script chống giật ngôn ngữ (Anti-Flicker) từ thư mục public.
 */
export const localeAntiFlickerCode = readFileSync(
  resolve(process.cwd(), 'public/scripts/locale-switch-anti-flicker.js'),
  'utf-8',
);

/**
 * Hàm hỗ trợ nhường quyền xử lý cho Event Loop (Microtask / Macrotask queue).
 * Tác dụng: Chờ cho các tác vụ bất đồng bộ hoặc thao tác chuyển hướng/DOM hoàn tất trước khi assert.
 */
export async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Khởi tạo môi trường client helper trên window toàn cục (giả lập inline script từ server).
 */
export function setupWindowLocaleHelpers(
  locales: readonly string[] = ['en', 'ja', 'vi'],
  defaultLocale: string = 'en',
): void {
  const helpers = createLocaleSwitchHelpers();
  const nsKey = LOCALE_TEST_CONFIG.NS_KEY;

  (window as any).__NS_ClientLocaleSwitchHelper = nsKey;
  (window as any)[nsKey] = {
    helpers: {
      getSegments: helpers.getSegments,
      isValidLocale: helpers.isValidLocale,
      getCurrentLocale: helpers.getCurrentLocale,
      cleanSegments: helpers.cleanSegments,
      buildPath: helpers.buildPath,
    },
    locales,
    defaultLocale,
  };
}

/**
 * Thực thi trực tiếp đoạn script Anti-Flicker trong môi trường window/document giả lập.
 */
export function runLocaleAntiFlickerScript(): void {
  // eslint-disable-next-line no-eval
  eval(localeAntiFlickerCode);
}

/**
 * Tạo nút bấm đổi ngôn ngữ [data-locale-toggle] gắn vào document.body để mô phỏng thao tác click.
 */
export function mountLocaleToggleButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.setAttribute('data-locale-toggle', '');
  document.body.appendChild(button);
  return button;
}

/**
 * Giả lập hành vi của Astro View Transitions navigate(targetUrl):
 * Cập nhật pathname hiện tại và kích hoạt sự kiện 'astro:after-swap'.
 */
export function simulateAstroNavigate(targetUrl: string): void {
  const url = new URL(targetUrl, 'http://localhost');
  window.location.pathname = url.pathname;
  window.location.search = url.search;
  window.location.hash = url.hash;
  window.location.href = url.href;
  document.dispatchEvent(new Event('astro:after-swap'));
}
