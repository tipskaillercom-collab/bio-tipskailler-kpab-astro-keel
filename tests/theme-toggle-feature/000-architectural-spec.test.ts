/**
 * File: tests/theme-toggle-feature/000-architectural-spec.test.ts
 * Mô tả: Bộ kiểm thử kiến trúc (Architectural Specification) cho tính năng chuyển đổi giao diện (Theme Toggle).
 * Kiểm tra thứ tự ưu tiên dữ liệu khởi tạo, khả năng hạ cấp an toàn (Graceful Degradation / RAM Fallback),
 * tính năng tự động đồng bộ theo cài đặt Hệ điều hành (Live OS Scheme Syncing) và tương thích Astro ClientRouter (View
Transitions).
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMatchMediaMock,
  runAntiFlickerScript,
  TEST_CONFIG,
  yieldToEventLoop,
} from './theme-toggle.helpers';

describe('000: Architectural Specification Tests', () => {
  // Biến lưu trữ đối tượng mock matchMedia để giả lập cấu hình theme Hệ điều hành (prefers-color-scheme)
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

  // Lưu trữ PropertyDescriptor nguyên bản của window.localStorage để phục hồi sau mỗi test case
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  // Khởi tạo môi trường DOM và Storage sạch sẽ trước mỗi test case (Setup Hook)
  beforeEach(() => {
    // 1. Phục hồi localStorage Descriptor gốc nếu bị định nghĩa lại (mocked) ở test case trước
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }

    // 2. Dọn dẹp sạch toàn bộ dữ liệu tạm trong localStorage
    localStorage.clear();

    // 3. Xóa thuộc tính data-theme trên thẻ HTML root element
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);

    // 4. Thiết lập cấu hình nút bấm đổi giao diện tiêu chuẩn trên DOM giả lập
    document.body.innerHTML = `
      <button class="theme-toggle" type="button" data-theme-toggle>
        <span aria-hidden="true"></span>
      </button>
    `;

    // 5. Khôi phục lại trạng thái giả lập của tất cả các mock spies
    vi.restoreAllMocks();
  });

  describe('1. Kịch bản Khởi tạo & Ưu tiên (Initial Theme Selection Order)', () => {
    test('1.1. Lần đầu truy cập (localStorage trống) -> Đọc OS preference = dark', () => {
      // ARRANGE: Giả lập Hệ điều hành đang ở chế độ Dark mode
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      // ACT: Chạy script Anti-Flicker đồng bộ khởi tạo theme
      runAntiFlickerScript();

      // ASSERT: Thuộc tính data-theme trên <html> phải là 'dark'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.2. Lần đầu truy cập (localStorage trống) -> Đọc OS preference = light', () => {
      // ARRANGE: Giả lập Hệ điều hành đang ở chế độ Light mode
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      // ACT: Chạy script Anti-Flicker đồng bộ khởi tạo theme
      runAntiFlickerScript();

      // ASSERT: Thuộc tính data-theme trên <html> phải là 'light'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });

    test('1.3. Khởi tạo khi localStorage = dark & OS = light -> localStorage ghi đè OS', () => {
      // ARRANGE: Hệ điều hành là Light mode nhưng người dùng đã lưu chế độ 'dark' trước đó
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');

      // ACT: Chạy script Anti-Flicker khởi tạo
      runAntiFlickerScript();

      // ASSERT: Ưu tiên thiết lập người dùng đã lưu ('dark') đè lên cấu hình OS ('light')
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.4. Khởi tạo khi localStorage = dark & OS = dark -> localStorage ghi đè OS', () => {
      // ARRANGE: Hệ điều hành là Dark mode nhưng người dùng đã lưu chế độ 'dark' trước đó
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');

      // ACT: Chạy script Anti-Flicker khởi tạo
      runAntiFlickerScript();

      // ASSERT: Ưu tiên thiết lập người dùng đã lưu ('dark') đè lên cấu hình OS ('dark')
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('1.5. Khởi tạo khi localStorage = light & OS = dark -> localStorage ghi đè OS', () => {
      // ARRANGE: Hệ điều hành là Dark mode nhưng người dùng đã lưu chế độ 'light' trước đó
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');

      // ACT: Chạy script Anti-Flicker khởi tạo
      runAntiFlickerScript();

      // ASSERT: Ưu tiên thiết lập người dùng đã lưu ('light') đè lên cấu hình OS ('dark')
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });

    test('1.6. Khởi tạo khi localStorage = light & OS = light -> localStorage ghi đè OS', () => {
      // ARRANGE: Hệ điều hành là Light mode nhưng người dùng đã lưu chế độ 'light' trước đó
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');

      // ACT: Chạy script Anti-Flicker khởi tạo
      runAntiFlickerScript();

      // ASSERT: Ưu tiên thiết lập người dùng đã lưu ('light') đè lên cấu hình OS ('light')
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('2. Graceful Degradation / RAM Fallback', () => {
    test('2.1. localStorage bị chặn SecurityError -> Anti-Flicker fallback về OS setting', async () => {
      // ARRANGE: Giả lập OS chế độ Dark mode và vô hiệu hóa truy cập localStorage (SecurityError)
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('Access denied', 'SecurityError');
        },
        configurable: true,
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // ACT: Thực thi Anti-Flicker script và nhường luồng xử lý bất đồng bộ
      runAntiFlickerScript();
      await yieldToEventLoop();

      // ASSERT: Thuộc tính data-theme tự hạ cấp an toàn về theme OS và đưa ra cảnh báo warn
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(warnSpy).toHaveBeenCalledWith(
        TEST_CONFIG.LOG_MESSAGES.ANTI_FLICKER_STORAGE_DENIED,
        expect.any(Error),
      );
    });

    test('2.2. localStorage.setItem bị chặn -> Toggle click sử dụng RAM fallback', async () => {
      // ARRANGE: Khởi tạo theme ban đầu thành công, sau đó chặn quyền ghi setItem
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      runAntiFlickerScript();

      const { getFallbackRamTheme } = await import('../../src/scripts/theme/theme-toggle');

      // Kiểm tra trạng thái ban đầu trước khi click: RAM fallback phải là null
      expect(getFallbackRamTheme()).toBeNull();

      const realLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        get() {
          return {
            getItem: (key: string) => realLocalStorage.getItem(key),
            setItem: () => {
              throw new DOMException('Access denied', 'SecurityError');
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

      // ACT: Giả lập sự kiện người dùng bấm vào nút chuyển đổi giao diện
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: Giao diện DOM vẫn đổi sang 'dark' thành công nhờ sử dụng bộ nhớ tạm (RAM Fallback)
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(getFallbackRamTheme()).toBe('dark');
      expect(warnSpy).toHaveBeenCalledWith(
        TEST_CONFIG.LOG_MESSAGES.TOGGLE_STORAGE_DENIED,
        expect.any(Error),
      );
    });

    test('2.3. localStorage.setItem bị chặn -> Click thêm lần nữa cập nhật lại RAM fallback', async () => {
      // ARRANGE: Khởi tạo môi trường 'light' và chặn localStorage.setItem
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      runAntiFlickerScript();

      const { getFallbackRamTheme } = await import('../../src/scripts/theme/theme-toggle');

      const realLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        get() {
          return {
            getItem: (key: string) => realLocalStorage.getItem(key),
            setItem: () => {
              throw new DOMException('Access denied', 'SecurityError');
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

      // ACT 1: Click lần 1 ('light' -> 'dark')
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: `ACT 1`
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(getFallbackRamTheme()).toBe('dark');
      expect(warnSpy).toHaveBeenCalledWith(
        TEST_CONFIG.LOG_MESSAGES.TOGGLE_STORAGE_DENIED,
        expect.any(Error),
      );

      // ACT 2: Click lần 2 ('dark' -> 'light')
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: `ACT 2`: DOM và biến RAM fallback cùng đảo ngược về 'light'.
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
      expect(getFallbackRamTheme()).toBe('light');
      expect(warnSpy).toHaveBeenCalledWith(
        TEST_CONFIG.LOG_MESSAGES.TOGGLE_STORAGE_DENIED,
        expect.any(Error),
      );

      // ASSERT: `ACT 1` + `ACT 1` : Cảnh báo gọi tổng cộng 2 lần
      expect(warnSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('3. Kịch bản Đồng bộ Động (Live OS Scheme Syncing)', () => {
    test('3.1. Chưa chọn localStorage -> Tự đồng bộ thời gian thực khi OS đổi theme', async () => {
      // ARRANGE: Khởi tạo hệ điều hành ở chế độ Light mode
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );

      runAntiFlickerScript();
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');

      // ACT: Giả lập sự kiện Hệ điều hành thay đổi giao diện sang Dark mode trong thời gian thực
      matchMediaMock.dispatchOsChange(true);
      await yieldToEventLoop();

      // ASSERT: Trang web tự động cập nhật thuộc tính data-theme sang 'dark' theo OS
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });

    test('3.2. Đã có localStorage -> Giữ nguyên trạng thái do user chọn khi OS đổi theme', async () => {
      // ARRANGE: Khởi tạo OS = Light mode nhưng đã có lựa chọn cố định trong localStorage = 'light'
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'light');

      // ACT: Khởi chạy và kích hoạt sự kiện Hệ điều hành đổi sang Dark mode
      runAntiFlickerScript();
      matchMediaMock.dispatchOsChange(true);
      await yieldToEventLoop();

      // ASSERT: Trang web vẫn giữ nguyên 'light' do người dùng đã chủ động chọn theme trước đó
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('4. Kịch bản Tương thích Astro ClientRouter (View Transitions)', () => {
    test('4.1. Sự kiện astro:after-swap khôi phục data-theme và giữ bộ lắng nghe click', async () => {
      // ARRANGE: Thiết lập trạng thái theme là 'dark'
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation(() => matchMediaMock),
      );
      localStorage.setItem(TEST_CONFIG.STORAGE_KEY, 'dark');

      runAntiFlickerScript();
      await import('../../src/scripts/theme/theme-toggle');

      // Giả lập Astro tiến hành chuyển trang: Xóa attribute và thay thế cấu trúc DOM mới
      document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
      document.body.innerHTML = `
        <button class="theme-toggle-new" type="button" data-theme-toggle>
          <span class="icon"></span>
        </button>
      `;

      // ACT 1: Phát sự kiện chuyển trang của Astro ClientRouter
      document.dispatchEvent(new Event('astro:after-swap'));
      await yieldToEventLoop();

      // ASSERT 1: data-theme được khôi phục chính xác là 'dark'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');

      // ACT 2: Giả lập click nút toggle giao diện trên trang mới
      const newButton = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;
      newButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT 2: Bộ lắng nghe sự kiện vẫn hoạt động bình thường trên DOM mới và chuyển sang 'light'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });
});
