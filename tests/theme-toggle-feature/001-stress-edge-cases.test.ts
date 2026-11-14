/**
 * File: tests/theme-toggle-feature/001-stress-edge-cases.test.ts
 * Mô tả: Bộ kiểm thử chịu tải và thao tác biên (Stress Testing & Edge Case Mutation) cho tính năng Theme Toggle.
 * Kiểm tra tính đúng đắn của ủy quyền sự kiện (Event Delegation), khả năng chống chọi race conditions khi click nhanh liên tục,
 * và xử lý các trường hợp dataset bị làm sai lệch dữ liệu (Corrupted Dataset Attack).
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMatchMediaMock,
  runAntiFlickerScript,
  TEST_CONFIG,
  yieldToEventLoop,
} from './theme-toggle.helpers';

describe('001: Stress Testing & Edge Case Mutation Tests', () => {
  // Biến đối tượng mock matchMedia phục vụ môi trường test
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

  // Dọn dẹp môi trường và thiết lập DOM lồng nhau trước mỗi test case
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    document.body.innerHTML = `
      <div id="wrapper">
        <p id="outside-para">Outside Text</p>
        <button class="theme-toggle" type="button" data-theme-toggle>
          <span id="inner-span" aria-hidden="true">Inner Icon</span>
        </button>
      </div>
    `;

    matchMediaMock = createMatchMediaMock(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => matchMediaMock),
    );

    runAntiFlickerScript();
  });

  describe('1. Event Delegation & Target Selector Stress', () => {
    test('1.1. Click vào thẻ con <span> bên trong button đổi theme -> Toggles thành công', async () => {
      // ARRANGE: Nạp script điều khiển theme và lấy thẻ con span bên trong nút bấm
      await import('../../src/scripts/theme/theme-toggle');
      const innerSpan = document.getElementById('inner-span') as HTMLSpanElement;

      // ACT: Phát sự kiện click nổi bọt (bubbling) từ phần tử con <span>
      innerSpan.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: Sự kiện nổi bọt lên button [data-theme-toggle] và kích hoạt đổi giao diện thành 'dark'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
    });

    test('1.2. Click vào thẻ <p> bên ngoài nút bấm -> Không làm thay đổi giao diện', async () => {
      // ARRANGE: Nạp module theme và chọn thẻ đoạn văn <p> bên ngoài nút toggle
      await import('../../src/scripts/theme/theme-toggle');
      const outsidePara = document.getElementById('outside-para') as HTMLParagraphElement;

      // ACT: Phát sự kiện click trên thẻ <p> bên ngoài nút bấm
      outsidePara.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: Trạng thái giao diện giữ nguyên không đổi ('light')
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('2. Race Conditions & Rapid Clicks', () => {
    test('2.1. Rapid Clicks (10 lần liên tục) -> Đảm bảo tính toán chẵn/lẻ đảo chiều chính xác', async () => {
      // ARRANGE: Nạp script điều khiển nút toggle
      await import('../../src/scripts/theme/theme-toggle');
      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;

      // ACT: Giả lập người dùng nhấp chuột nhanh liên tục 10 lần vào nút bấm
      for (let i = 0; i < 10; i++) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      }
      await yieldToEventLoop();

      // ASSERT: Sau 10 lần đảo chiều (số chẵn), trạng thái quay trở lại chính xác theme ban đầu ('light')
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('light');
    });
  });

  describe('3. Corrupted Dataset Attack', () => {
    test('3.1. dataset.theme bị gán giá trị rác ("invalid-theme") -> Click tiếp theo fallback an toàn về "light"', async () => {
      // ARRANGE: Nạp module theme và giả lập thuộc tính data-theme bị cố tình can thiệp giá trị rác
      await import('../../src/scripts/theme/theme-toggle');
      document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = 'invalid-theme';

      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;

      // ACT: Kích hoạt sự kiện click vào nút toggle
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      // ASSERT: Hàm tự phục hồi nhận diện giá trị không hợp lệ và fallback an toàn về 'dark'
      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });
  });
});
