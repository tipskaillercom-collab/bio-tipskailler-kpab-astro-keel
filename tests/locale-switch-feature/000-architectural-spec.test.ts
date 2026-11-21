/**
 * File: tests/locale-switch-feature/000-architectural-spec.test.ts
 * Mô tả: Bộ kiểm thử kiến trúc (Architectural Specification) cho tính năng Locale Switch.
 * Kiểm tra khởi tạo ưu tiên, điều hướng Anti-Flicker, xoay vòng locale và tương thích View Transitions.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { navigate } from 'astro:transitions/client';
import {
  LOCALE_TEST_CONFIG,
  mountLocaleToggleButton,
  runLocaleAntiFlickerScript,
  setupWindowLocaleHelpers,
  simulateAstroNavigate,
  yieldToEventLoop,
} from './locale-switch.helpers';
import '../../src/scripts/locale-switch/locale-switch-toggler';

// Mock module điều hướng của Astro View Transitions
vi.mock('astro:transitions/client', () => ({
  navigate: vi.fn((url: string) => {
    simulateAstroNavigate(url);
  }),
}));

describe('000: Locale Switch Architectural Specification Tests', () => {
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');
  const originalLocation = window.location;
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');

  const swapListeners: EventListenerOrEventListenerObject[] = [];
  const originalAddEventListener = document.addEventListener.bind(document);

  beforeEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    localStorage.clear();
    delete window.__FALLBACK_LOCALE;
    document.body.innerHTML = '';

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

    vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
      if (type === 'astro:after-swap') {
        swapListeners.push(listener);
      }
      return originalAddEventListener(type, listener, options);
    });

    setupWindowLocaleHelpers(['en', 'ja', 'vi'], 'en');
    vi.clearAllMocks();
  });

  afterEach(() => {
    while (swapListeners.length > 0) {
      const listener = swapListeners.pop();
      if (listener) {
        document.removeEventListener('astro:after-swap', listener);
      }
    }

    if (originalLocationDescriptor) {
      Object.defineProperty(window, 'location', originalLocationDescriptor);
    }
    vi.restoreAllMocks();
  });

  describe('1. Kịch bản Khởi tạo Ưu tiên & Anti-Flicker Routing', () => {
    test('1.1. Ưu tiên đọc localStorage khi hợp lệ', async () => {
      localStorage.setItem(LOCALE_TEST_CONFIG.STORAGE_KEY, 'vi');
      window.location.pathname = '/vi/about';

      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset[LOCALE_TEST_CONFIG.DATA_ATTRIBUTE]).toBe('vi');
    });

    test('1.2. Fallback về navigator.language khi localStorage trống', async () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');

      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      expect(window.location.href).toContain('/ja');
    });

    test('1.3. Chuẩn hóa URL thừa tiền tố mặc định (Default Prefix Guard)', async () => {
      window.location.pathname = '/en/about';

      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      expect(window.location.href).toBe('/about');
    });
  });

  describe('2. Kịch bản Hạ cấp An toàn (Graceful Degradation)', () => {
    const blockLocalStorage = () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
        configurable: true,
      });
    };

    test('2.1. Chặn localStorage -> Anti-Flicker fallback không crash ứng dụng', async () => {
      blockLocalStorage();

      expect(() => runLocaleAntiFlickerScript()).not.toThrow();
    });

    test('2.2. Chặn localStorage -> Click nút đổi ngôn ngữ lần đầu chuyển đúng sang ngôn ngữ kế tiếp và không bị đá ngược', async () => {
      blockLocalStorage();
      runLocaleAntiFlickerScript();
      const toggleBtn = mountLocaleToggleButton();

      toggleBtn.click();
      await yieldToEventLoop();

      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/ja/');
      expect(window.location.pathname).toBe('/ja/');
      expect(document.documentElement.dataset.locale).toBe('ja');
      expect(window.__FALLBACK_LOCALE).toBe('ja');
    });

    test('2.3. Chặn localStorage -> Click đổi ngôn ngữ liên tiếp xoay vòng trọn vẹn chu kỳ (en -> ja -> vi -> en)', async () => {
      blockLocalStorage();
      runLocaleAntiFlickerScript();
      const toggleBtn = mountLocaleToggleButton();

      toggleBtn.click();
      await yieldToEventLoop();
      expect(navigate).toHaveBeenLastCalledWith('/ja/');
      expect(window.location.pathname).toBe('/ja/');
      expect(document.documentElement.dataset.locale).toBe('ja');

      toggleBtn.click();
      await yieldToEventLoop();
      expect(navigate).toHaveBeenLastCalledWith('/vi/');
      expect(window.location.pathname).toBe('/vi/');
      expect(document.documentElement.dataset.locale).toBe('vi');

      toggleBtn.click();
      await yieldToEventLoop();
      expect(navigate).toHaveBeenLastCalledWith('/');
      expect(window.location.pathname).toBe('/');
      expect(document.documentElement.dataset.locale).toBe('en');
      expect(navigate).toHaveBeenCalledTimes(3);
    });
  });

  describe('3. Kịch bản Tương thích Astro View Transitions', () => {
    test('3.1. astro:after-swap khôi phục thuộc tính data-locale trên DOM mới', async () => {
      localStorage.setItem(LOCALE_TEST_CONFIG.STORAGE_KEY, 'ja');
      window.location.pathname = '/ja/';
      runLocaleAntiFlickerScript();

      document.documentElement.removeAttribute('data-locale');
      document.dispatchEvent(new Event('astro:after-swap'));
      await yieldToEventLoop();

      expect(document.documentElement.dataset.locale).toBe('ja');
    });
  });
});
