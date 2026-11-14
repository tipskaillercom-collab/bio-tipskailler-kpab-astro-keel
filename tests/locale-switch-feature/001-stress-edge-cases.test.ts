/**
 * File: tests/locale-switch-feature/001-stress-edge-cases.test.ts
 * Mô tả: Các ca kiểm thử chịu tải nâng cao (Stress Test) và tấn công đột biến dữ liệu/DOM.
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { createLocaleSwitchHelpers } from '../../src/helpers/locale-switch/locale-switch';

describe('001: Locale Switch Stress & Edge Cases Tests', () => {
  const helpers = createLocaleSwitchHelpers();
  const locales = ['en', 'ja', 'vi'] as const;

  describe('1. Dynamic Path Construction & Query/Hash Preservation', () => {
    test('1.1. Xử lý chuẩn xác URL bị lặp gạch chéo và bảo toàn query/hash', () => {
      // ARRANGE: Giả lập URL có query và hash phức tạp
      delete (window as any).location;
      window.location = {
        pathname: '///vi///blog//post-1',
        search: '?ref=facebook&sort=asc',
        hash: '#comments',
      } as any;

      const clean = helpers.cleanSegments(['vi', 'blog', 'post-1'], true);

      // ACT: Build lại path cho defaultLocale ('en') và alternateLocale ('ja')
      const defaultPath = helpers.buildPath('en', clean, 'en');
      const alternatePath = helpers.buildPath('ja', clean, 'en');

      // ASSERT: Loại bỏ gạch chéo thừa, giấu prefix en, giữ nguyên query & hash
      expect(defaultPath).toBe('/blog/post-1?ref=facebook&sort=asc#comments');
      expect(alternatePath).toBe('/ja/blog/post-1?ref=facebook&sort=asc#comments');
    });
  });

  describe('2. Malformed Segment Resilience', () => {
    test('2.1. Phân đoạn locale không hợp lệ -> Fallback về defaultLocale', () => {
      // ARRANGE: URL chứa locale lạ '/fr/about'
      const segments = ['fr', 'about'];
      const hasPrefix = helpers.isValidLocale(segments[0], locales);

      // ACT: Lấy locale hiện tại
      const current = helpers.getCurrentLocale(segments, hasPrefix, 'en');

      // ASSERT: hasPrefix là false, fallback về 'en'
      expect(hasPrefix).toBe(false);
      expect(current).toBe('en');
    });
  });
});
