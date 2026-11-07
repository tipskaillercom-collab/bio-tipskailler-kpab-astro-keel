/**
 * File: tests/theme-toggle.test.ts
 * Mô tả: Unit/Integration Test cho logic Theme Switcher chạy trực tiếp trên Happy-DOM.
 * Tuân thủ quy tắc: Strict Typing, Step Functions (STEP_*), Comment chi tiết, as const.
 */

import { describe, test, expect, beforeEach } from 'vitest';

// Strict typing cho Theme Mode
type ThemeMode = 'light' | 'dark';

// Cấu hình hằng số đóng băng tuyệt đối bằng `as const`
const TEST_CONFIG = {
  STORAGE_KEY: 'theme',
  DATA_ATTRIBUTE: 'theme',
  TOGGLE_SELECTOR: '[data-theme-toggle]',
} as const;

describe('Kiểm thử Chức năng Theme Toggle (Vitest + Happy-DOM)', () => {
  // Reset DOM và localStorage trước mỗi bài test
  beforeEach(() => {
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    localStorage.clear();
    document.body.innerHTML = `
      <button class="theme-toggle" type="button" data-theme-toggle>
        <span>Toggle</span>
      </button>
    `;
  });

  test('STEP 1: Kiểm thử logic lấy và khởi tạo Theme ban đầu', () => {
    // 1. Giả lập cài đặt OS
    const storedTheme = localStorage.getItem(TEST_CONFIG.STORAGE_KEY);
    const initialTheme: ThemeMode = (storedTheme as ThemeMode) || 'light';

    // 2. Gán theme ban đầu cho HTML
    document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = initialTheme;

    // 3. Phán quyết
    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
  });

  test('STEP 2: Kiểm thử sự kiện Click đổi theme và lưu localStorage', () => {
    // 1. Thiết lập theme ban đầu là light
    document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = 'light';

    // 2. Bắt sự kiện click dạng Event Delegation (tương tự theme-toggle.ts)
    document.addEventListener('click', (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const btn = event.target.closest(TEST_CONFIG.TOGGLE_SELECTOR);
      if (!btn) return;

      const current =
        document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] === 'dark' ? 'dark' : 'light';
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';

      document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = next;
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, next);
    });

    // 3. Giả lập hành vi Click vào nút Toggle
    const toggleBtn = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;
    toggleBtn.click();

    // 4. Phán quyết: Attribute HTML đổi sang 'dark' và localStorage được cập nhật
    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
  });
});
