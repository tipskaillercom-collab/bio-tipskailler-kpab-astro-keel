import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMatchMediaMock,
  runAntiFlickerScript,
  TEST_CONFIG,
  yieldToEventLoop,
} from './theme-toggle.helpers';

describe('001: Stress Testing & Edge Case Mutation Tests', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

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
      await import('../../src/scripts/theme/theme-toggle');
      const innerSpan = document.getElementById('inner-span') as HTMLSpanElement;

      innerSpan.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
    });

    test('1.2. Click vào thẻ <p> bên ngoài nút bấm -> Không làm thay đổi giao diện', async () => {
      await import('../../src/scripts/theme/theme-toggle');
      const outsidePara = document.getElementById('outside-para') as HTMLParagraphElement;

      outsidePara.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    });
  });

  describe('2. Race Conditions & Rapid Clicks', () => {
    test('2.1. Rapid Clicks (10 lần liên tục) -> Đảm bảo tính toán chẵn/lẻ đảo chiều chính xác', async () => {
      await import('../../src/scripts/theme/theme-toggle');
      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;

      for (let i = 0; i < 10; i++) {
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      }
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
      expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('light');
    });
  });

  describe('3. Corrupted Dataset Attack', () => {
    test('3.1. dataset.theme bị gán giá trị rác ("invalid-theme") -> Click tiếp theo fallback an toàn về "light"', async () => {
      await import('../../src/scripts/theme/theme-toggle');
      document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = 'invalid-theme';

      const button = document.querySelector(TEST_CONFIG.TOGGLE_SELECTOR) as HTMLButtonElement;
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
      await yieldToEventLoop();

      expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    });
  });
});
