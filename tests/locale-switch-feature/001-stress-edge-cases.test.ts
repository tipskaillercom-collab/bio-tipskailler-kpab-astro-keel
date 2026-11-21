/**
 * File: tests/locale-switch-feature/001-stress-edge-cases.test.ts
 * Mô tả: Các ca kiểm thử chịu tải nâng cao (Stress Test) và tấn công đột biến dữ liệu/DOM cho Locale Switch.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createLocaleSwitchHelpers } from '../../src/helpers/locale-switch/locale-switch';
import {
  mountLocaleToggleButton,
  setupWindowLocaleHelpers,
  yieldToEventLoop,
} from './locale-switch.helpers';
import '../../src/scripts/locale-switch/locale-switch-toggler';

describe('001: Locale Switch Stress & Edge Cases Tests', () => {
  const helpers = createLocaleSwitchHelpers();
  const locales = ['en', 'ja', 'vi'] as const;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setupWindowLocaleHelpers(locales, 'en');
  });

  describe('1. Dynamic Path Construction & Query/Hash Preservation', () => {
    test('1.1. Xử lý chuẩn xác URL bị lặp gạch chéo và bảo toàn query/hash', () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: {
          pathname: '///vi///blog//post-1',
          search: '?ref=facebook&sort=asc',
          hash: '#comments',
        },
      });

      const clean = helpers.cleanSegments(['vi', 'blog', 'post-1'], true);

      const defaultPath = helpers.buildPath('en', clean, 'en');
      const alternatePath = helpers.buildPath('ja', clean, 'en');

      expect(defaultPath).toBe('/blog/post-1?ref=facebook&sort=asc#comments');
      expect(alternatePath).toBe('/ja/blog/post-1?ref=facebook&sort=asc#comments');
    });
  });

  describe('2. Event Delegation & Deep Nested DOM Targets', () => {
    test('2.1. Click vào thẻ SVG/path nằm sâu bên trong button -> Vẫn kích hoạt đổi ngôn ngữ', async () => {
      // 1. Đảm bảo window.location đang ở trang chủ '/' (ngôn ngữ mặc định 'en')
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: {
          pathname: '/',
          search: '',
          hash: '',
          href: 'http://localhost/',
        },
      });

      // 2. Mount nút bấm vào DOM
      const button = mountLocaleToggleButton();
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(path);
      button.appendChild(svg);

      // 3. Giả lập sự kiện click từ thẻ <path> bên trong SVG nổi bọt lên button
      const clickEvent = new MouseEvent('click', { bubbles: true, composed: true });
      path.dispatchEvent(clickEvent);

      // 4. Nhường luồng cho Event Loop để Toggler xử lý xong STEP_3 & STEP_4
      await yieldToEventLoop();

      // Assert: Ngôn ngữ tiếp theo trong vòng xoay (en -> ja) phải được ghi vào storage
      expect(localStorage.getItem('locale')).toBe('ja');
    });
  });

  describe('3. Malformed Segment Resilience', () => {
    test('3.1. Phân đoạn locale không hợp lệ -> Fallback về defaultLocale', () => {
      const segments = ['fr', 'about'];
      const hasPrefix = helpers.isValidLocale(segments[0], locales);
      const current = helpers.getCurrentLocale(segments, hasPrefix, 'en');

      expect(hasPrefix).toBe(false);
      expect(current).toBe('en');
    });
  });
});
