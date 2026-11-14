/**
 * File: tests/theme-toggle-feature/002-security-hardening.test.ts
 * Mô tả: Bộ kiểm thử gia cố bảo mật và giảm thiểu rủi ro môi trường (Security Hardening & Threat Mitigation).
 * Kiểm tra khả năng ứng phó sự cố vượt quá dung lượng bộ nhớ (Storage Quota Exceeded), tiêm nhiễm dữ liệu độc hại (Storage
Tampering / XSS Payload),
 * và cô lập xung đột cấu trúc DOM (DOM Clobbering Isolation).
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMatchMediaMock,
  runAntiFlickerScript,
  TEST_CONFIG,
  yieldToEventLoop,
} from './theme-toggle.helpers';

describe('002: Security Hardening & Threat Mitigation Tests', () => {
  // Biến lưu trữ PropertyDescriptor ban đầu của localStorage để khôi phục lại sau mỗi lần chạy
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  // Khôi phục môi trường và khởi tạo DOM sạch trước mỗi test case
  beforeEach(() => {
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }
    localStorage.clear();
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    document.body.innerHTML = `
      <button class="theme-toggle" type="button" data-theme-toggle>
        <span aria-hidden="true"></span>
      </button>
    `;

    // Giả lập Hệ điều hành đang ở chế độ Light mode
    const matchMediaMock = createMatchMediaMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => matchMediaMock),
    );
  });

  describe('1. Denial of Service Mitigation (Storage Quota Exceeded)', () => {
    test('1.1. Storage Quota Exceeded: Bắt QuotaExceededError và sử dụng mượt RAM Fallback', async () => {
      // ARRANGE: Khởi tạo Anti-Flicker và nạp module theme toggle
      runAntiFlickerScript();
      await import('../../src/scripts/theme/theme-toggle');

      // Giả lập môi trường bị tràn bộ nhớ trình duyệt (QuotaExceededError) khi gọi setItem
      const realLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        get() {
          return {
            getItem: (key: string) => realLocalStorage.getItem(key),
            setItem: () => {
              throw new DOMException('QuotaExceededError', 'QuotaExceededError');
            },
            removeItem: (key: string) => realLocalStorage.removeItem(key),
            clear: () => realLocalStorage.clear(),
            length: realLocalStorage.length,
            key: (index: number) => realLocalStorage.key(index),
          };
        },
        configurable: true,
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;

      // ACT: Người dùng kích hoạt sự kiện đổi giao diện
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: Trang không bị crash, ứng dụng tự chuyển đổi mượt sang RAM fallback và thông báo console.warn
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(warnSpy).toHaveBeenCalledWith(
        TEST_CONFIG.LOG_MESSAGES.TOGGLE_STORAGE_DENIED,
        expect.any(Error),
      );
    });
  });

  describe('2. Storage Tampering & Malformed Data Mitigation', () => {
    test('2.1. Tiêm nhiễm mã độc/script rác vào localStorage -> Anti-Flicker hạ cấp về giá trị hợp lệ', async () => {
      // ARRANGE: Giả lập dữ liệu trong localStorage bị hacker/extension bên thứ 3 sửa thành script XSS độc hại
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, '<script>alert("xss")</script>');

      // ACT: Thực thi script Anti-Flicker đồng bộ
      runAntiFlickerScript();
      await yieldToEventLoop();

      // ASSERT: Logic lọc bóc tách giá trị rác độc hại và tự động hạ cấp an toàn về theme mặc định hợp lệ ('light')
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('3. DOM Clobbering Isolation Test', () => {
    test('3.1. Chèn phần tử có id="theme" đè biến toàn cục -> Dataset truy vấn không bị sập', async () => {
      // ARRANGE: Tạo một thẻ <div> lạ có id trùng với tên thuộc tính "theme" nhằm tấn công DOM Clobbering
      const clobberedDiv = document.createElement('div');
      clobberedDiv.id = 'theme';
      document.body.appendChild(clobberedDiv);

      // ACT: Khởi chạy ứng dụng và thực hiện thao tác click chuyển đổi giao diện
      runAntiFlickerScript();
      await import('../../src/scripts/theme/theme-toggle');

      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: Việc truy cập document.documentElement.dataset không bị ảnh hưởng và chuyển đổi theme 'dark' chính xác
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });
  });
});
