/**
 * File: tests/locale-switch-feature/000-architectural-spec.test.ts
 * Mô tả: Bộ kiểm thử kiến trúc (Architectural Specification) cho tính năng Locale Switch.
 * Kiểm tra khởi tạo ưu tiên, điều hướng Anti-Flicker, xoay vòng locale và tương thích View Transitions.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  LOCALE_TEST_CONFIG,
  runLocaleAntiFlickerScript,
  setupWindowLocaleHelpers,
  yieldToEventLoop,
} from './locale-switch.helpers';

describe('000: Locale Switch Architectural Specification Tests', () => {
  // Lưu lại PropertyDescriptor gốc của localStorage và location để khôi phục sau mỗi test case
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
  const originalLocation = window.location;
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');

  beforeEach(() => {
    // 1. Phục hồi localStorage Descriptor gốc
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    localStorage.clear();

    // 2. Mock window.location bằng defineProperty để không đụng kiểu setter của TS
    Object.defineProperty(window, 'location', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: {
        ...originalLocation,
        pathname: '/',
        search: '',
        hash: '',
        href: 'http://localhost/',
      },
    });

    // 3. Khởi tạo helper trên window
    setupWindowLocaleHelpers(['en', 'ja', 'vi'], 'en');
  });

  afterEach(() => {
    if (originalLocationDescriptor) {
      Object.defineProperty(window, 'location', originalLocationDescriptor);
    }
    vi.restoreAllMocks();
  });

  describe('1. Kịch bản Khởi tạo Ưu tiên & Anti-Flicker Routing', () => {
    test('1.1. Ưu tiên đọc localStorage khi hợp lệ', async () => {
      // ARRANGE: Cấu hình localStorage = 'vi'
      localStorage.setItem(LOCALE_TEST_CONFIG.STORAGE_KEY, 'vi');
      window.location.pathname = '/vi/about';

      // ACT: Thực thi Anti-Flicker
      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      // ASSERT: HTML element nhận data-locale="vi"
      expect(document.documentElement.dataset[LOCALE_TEST_CONFIG.DATA_ATTRIBUTE]).toBe('vi');
    });

    test('1.2. Fallback về navigator.language khi localStorage trống', async () => {
      // ARRANGE: Giả lập browser language là 'ja-JP'
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');

      // ACT: Thực thi Anti-Flicker
      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      // ASSERT: Chuyển hướng sang trang target locale 'ja'
      expect(window.location.href).toContain('/ja');
    });

    test('1.3. Chuẩn hóa URL thừa tiền tố mặc định (Default Prefix Guard)', async () => {
      // ARRANGE: URL chứa /en/about (khi en là defaultLocale)
      window.location.pathname = '/en/about';

      // ACT: Thực thi Anti-Flicker
      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      // ASSERT: Tự động điều hướng về canonical URL không chứa /en
      expect(window.location.href).toBe('/about');
    });
  });

  describe('2. Kịch bản Hạ cấp An toàn (Graceful Degradation)', () => {
    test('2.1. Chặn localStorage -> Anti-Flicker fallback không crash ứng dụng', async () => {
      // ARRANGE: Giả lập môi trường bị chặn SecurityError
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
        configurable: true,
      });

      // ACT & ASSERT: Thực thi mà không throw exception
      expect(() => runLocaleAntiFlickerScript()).not.toThrow();
    });
  });

  describe('3. Kịch bản Tương thích Astro View Transitions', () => {
    test('3.1. astro:after-swap khôi phục thuộc tính data-locale trên DOM mới', async () => {
      // ARRANGE: Đặt locale = 'ja'
      localStorage.setItem(LOCALE_TEST_CONFIG.STORAGE_KEY, 'ja');
      window.location.pathname = '/ja/';
      runLocaleAntiFlickerScript();

      // ACT: Giả lập astro:after-swap tráo đổi thẻ html
      document.documentElement.removeAttribute('data-locale');
      document.dispatchEvent(new Event('astro:after-swap'));
      await yieldToEventLoop();

      // ASSERT: data-locale được gán lại thành 'ja'
      expect(document.documentElement.dataset.locale).toBe('ja');
    });
  });
});
