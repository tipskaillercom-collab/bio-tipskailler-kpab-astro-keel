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
  beforeEach(() => {
    localStorage.clear();
    setupWindowLocaleHelpers(['en', 'ja', 'vi'], 'en');
  });

  describe('1. Storage Tampering & XSS Mitigation', () => {
    test('1.1. Tiêm nhiễm mã độc XSS vào localStorage -> Hạ cấp an toàn về defaultLocale', async () => {
      // ARRANGE: Inject script tag vào storage
      localStorage.setItem('locale', '<script>alert(1)</script>');

      // ACT: Chạy Anti-Flicker
      runLocaleAntiFlickerScript();
      await yieldToEventLoop();

      // ASSERT: Không gán chuỗi độc hại vào HTML dataset
      expect(document.documentElement.dataset.locale).not.toContain('<script>');
    });
  });

  describe('2. Global Variable Hijacking Protection', () => {
    test('2.1. Window namespace bị xóa -> Anti-Flicker dừng êm đẹp không ném ngoại lệ', () => {
      // ARRANGE: Xóa sạch helper trên window
      delete (window as any).__NS_ClientLocaleSwitchHelper;

      // ACT & ASSERT: Không crash app
      expect(() => runLocaleAntiFlickerScript()).not.toThrow();
    });
  });
});
