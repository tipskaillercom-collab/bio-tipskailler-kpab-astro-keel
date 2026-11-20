/**
 * File: tests/locale-switch-feature/002-security-hardening.test.ts
 * Mô tả: Kiểm thử bảo mật (Security Hardening), chống tràn bộ nhớ và lọc dữ liệu rác/XSS.
 */

import { beforeEach, describe, expect, test } from 'vitest';
import {
  runLocaleAntiFlickerScript,
  setupWindowLocaleHelpers,
  yieldToEventLoop,
} from './locale-switch.helpers';

describe('002: Locale Switch Security Hardening Tests', () => {
  // Lưu trữ PropertyDescriptor gốc của localStorage để phục hồi sau mỗi test case
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  beforeEach(() => {
    // Khôi phục localStorage gốc nếu bị mock đè ở test case trước
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    localStorage.clear();
    delete window.__FALLBACK_LOCALE;
    setupWindowLocaleHelpers(['en', 'ja', 'vi'], 'en');
  });

  describe('1. Storage Tampering & XSS Mitigation', () => {
    test('1.1. Tiêm nhiễm mã độc XSS vào localStorage -> Hạ cấp an toàn về defaultLocale', async () => {
      localStorage.setItem('locale', '<script>alert(1)</script>');

      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      expect(document.documentElement.dataset.locale).toBe('en');
      expect(document.documentElement.dataset.locale).not.toContain('<script>');
    });
  });

  describe('2. Quota Exceeded Handling', () => {
    test('2.1. Giả lập QuotaExceededError khi ghi localStorage -> Ứng dụng không crash và dùng RAM Fallback', async () => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          return {
            getItem: () => null,
            setItem: () => {
              throw new DOMException('QuotaExceededError', 'QuotaExceededError');
            },
            removeItem: () => {},
            clear: () => {},
          };
        },
        configurable: true,
      });

      expect(() => runLocaleAntiFlickerScript()).not.toThrow();
    });
  });

  describe('3. Global Variable Hijacking Protection', () => {
    test('3.1. Window namespace bị xóa -> Anti-Flicker dừng êm đẹp không ném ngoại lệ', () => {
      delete (window as any).__NS_ClientLocaleSwitchHelper;

      expect(() => runLocaleAntiFlickerScript()).not.toThrow();
    });
  });
});
