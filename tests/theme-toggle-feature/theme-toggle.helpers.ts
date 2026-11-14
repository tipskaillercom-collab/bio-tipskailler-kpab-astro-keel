/**
 * File: tests/theme-toggle-feature/theme-toggle.helpers.ts
 * Mô tả: File chứa các hàm hỗ trợ (helpers), hằng số cấu hình (TEST_CONFIG) và các công cụ giả lập (mocks)
 * phục vụ cho bộ kiểm thử tính năng chuyển đổi giao diện (Theme Toggle) và chống giật trang (Anti-Flicker).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';

/**
 * Hằng số cấu hình cố định phục vụ cho toàn bộ các test case về Theme.
 * Sử dụng `as const` để đóng băng kiểu dữ liệu ở mức compile-time.
 */
export const TEST_CONFIG = {
  // Key lưu trữ trạng thái giao diện trong localStorage
  STORAGE_KEY: 'theme',
  // Thuộc tính HTML data attribute dùng để định dạng theme trên DOM
  DATA_ATTRIBUTE: 'theme',
  // CSS Selector của nút bấm kích hoạt chuyển đổi giao diện
  TOGGLE_SELECTOR: '[data-theme-toggle]',
  LOG_MESSAGES: {
    ANTI_FLICKER_STORAGE_DENIED:
      '[Theme Anti-Flicker] Storage access denied, fallback to OS setting.',
    TOGGLE_STORAGE_DENIED: '[Theme Toggle] Cannot write to localStorage. Using RAM fallback.',
  },
} as const;

/**
 * Đọc đồng bộ nội dung mã nguồn của script chống giật trang (Anti-Flicker) từ thư mục public.
 * Đảm bảo script tĩnh được nạp chính xác vào môi trường kiểm thử DOM giả lập.
 */
export const antiFlickerCode = readFileSync(
  resolve(process.cwd(), 'public/scripts/theme-init-anti-flicker.js'),
  'utf-8',
);

/**
 * Hàm hỗ trợ nhường quyền xử lý cho Event Loop (Microtask / Macrotask queue).
 * Tác dụng: Chờ cho các tác vụ bất đồng bộ hoặc thao tác cập nhật DOM hoàn tất trước khi thực hiện assert.
 */
export async function yieldToEventLoop(): Promise<void> {
  // Trả về một Promise giải quyết sau 0ms để đẩy luồng thực thi xuống cuối Event Loop queue
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Thực thi trực tiếp đoạn script Anti-Flicker trong môi trường window/document giả lập.
 */
export function runAntiFlickerScript(): void {
  // eslint-disable-next-line no-eval
  eval(antiFlickerCode);
}

/**
 * Khởi tạo đối tượng giả lập (Mock) cho hàm `window.matchMedia`.
 * Phục vụ kiểm thử việc lắng nghe và đồng bộ trạng thái giao diện Hệ điều hành (prefers-color-scheme).
 *
 * @param initialPrefersDark Trạng thái ban đầu của OS (true = Dark mode, false = Light mode)
 */
export function createMatchMediaMock(initialPrefersDark: boolean = false) {
  // Tập hợp các hàm lắng nghe sự kiện thay đổi theme từ Hệ điều hành
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  let matches = initialPrefersDark;

  return {
    /** Lấy trạng thái hiện tại (true = dark, false = light) */
    get matches() {
      return matches;
    },
    // Chuỗi truy vấn media query tiêu chuẩn cho Dark mode
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    // Giả lập phương thức addListener (đã cũ nhưng vẫn hỗ trợ tương thích)
    addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => listeners.add(listener)),
    // Giả lập phương thức removeListener
    removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    ),
    // Giả lập phương thức addEventListener chuẩn W3C
    addEventListener: vi.fn((_type: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    // Giả lập phương thức removeEventListener chuẩn W3C
    removeEventListener: vi.fn((_type: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn(),
    /**
     * Hàm giả lập hành vi Hệ điều hành thay đổi giao diện theo thời gian thực (Live OS Change).
     * @param newPrefersDark Trạng thái mới của Hệ điều hành (true = Dark, false = Light)
     */
    dispatchOsChange(newPrefersDark: boolean) {
      matches = newPrefersDark;
      const event = {
        matches: newPrefersDark,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;
      // Báo sự kiện tới tất cả các hàm đăng ký lắng nghe
      listeners.forEach((listener) => listener(event));
    },
  };
}
