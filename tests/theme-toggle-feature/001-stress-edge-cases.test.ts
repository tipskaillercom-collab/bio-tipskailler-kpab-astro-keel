/**
 * File: tests/theme-toggle-feature/001-stress-edge-cases.test.ts
 * Mô tả: Kiểm thử tải, trường hợp biên và đột biến dataset đối với Theme Toggle.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const TEST_CONFIG = {
  STORAGE_KEY: 'theme',
  DATA_ATTRIBUTE: 'theme',
  TOGGLE_SELECTOR: '[data-theme-toggle]',
  ANTI_FLICKER_PATH: path.resolve(__dirname, '../../public/scripts/theme-init-anti-flicker.js'),
} as const;

const antiFlickerCode = fs.readFileSync(TEST_CONFIG.ANTI_FLICKER_PATH, 'utf-8');

function runAntiFlickerScript(): void {
  // eslint-disable-next-line no-eval
  eval(antiFlickerCode);
}

async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('001: Stress Testing & Edge Cases', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    document.body.innerHTML = `
      <header>
        <button class="theme-toggle" type="button" data-theme-toggle>
          <span id="inner-span">Inner Icon</span>
        </button>
        <p id="outside-paragraph">Random Paragraph</p>
      </header>
    `;
    localStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('5.1. Click phần tử con <span> vẫn tìm được nút nhờ closest()', async () => {
    runAntiFlickerScript();
    await import('../../src/scripts/theme/theme-toggle');

    const innerSpan = document.getElementById('inner-span')!;
    innerSpan.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    await yieldToEventLoop();

    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
  });

  test('5.2. Click phần tử ngẫu nhiên ngoài toggle button không đổi trạng thái', async () => {
    runAntiFlickerScript();
    await import('../../src/scripts/theme/theme-toggle');

    const outsideP = document.getElementById('outside-paragraph')!;
    outsideP.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    await yieldToEventLoop();

    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBeNull();
  });

  test('5.3. Click liên tiếp 7 lần (lẻ -> dark) và 8 lần (chẵn -> light) chính xác', async () => {
    runAntiFlickerScript();
    await import('../../src/scripts/theme/theme-toggle');

    const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;

    for (let i = 0; i < 7; i++) {
      button.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      );
    }

    await yieldToEventLoop();

    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');

    button.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    await yieldToEventLoop();

    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('light');
    expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('light');
  });

  test('5.4. Gán data-theme giá trị rác -> STEP_1_GET_CURRENT_THEME fallback về "light" rồi đổi thành "dark"', async () => {
    runAntiFlickerScript();
    await import('../../src/scripts/theme/theme-toggle');

    document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE] = 'corrupted-value';

    const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;
    button.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    await yieldToEventLoop();

    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
  });

  test('5.5. data-theme bị undefined -> Hệ thống tự phục hồi về "light" và đổi thành "dark"', async () => {
    runAntiFlickerScript();
    await import('../../src/scripts/theme/theme-toggle');

    document.documentElement.removeAttribute(`data-${TEST_CONFIG.DATA_ATTRIBUTE}`);
    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBeUndefined();

    const button = document.querySelector<HTMLButtonElement>(TEST_CONFIG.TOGGLE_SELECTOR)!;
    button.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );

    await yieldToEventLoop();

    expect(document.documentElement.dataset[TEST_CONFIG.DATA_ATTRIBUTE]).toBe('dark');
    expect(localStorage.getItem(TEST_CONFIG.STORAGE_KEY)).toBe('dark');
  });
});
