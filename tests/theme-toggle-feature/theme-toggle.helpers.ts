import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { vi } from 'vitest';

export const TEST_CONFIG = {
  STORAGE_KEY: 'theme',
  DATA_ATTRIBUTE: 'theme',
  TOGGLE_SELECTOR: '[data-theme-toggle]',
} as const;

export const antiFlickerCode = readFileSync(
  resolve(process.cwd(), 'public/scripts/theme-init-anti-flicker.js'),
  'utf-8',
);

export async function yieldToEventLoop(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

export function runAntiFlickerScript(): void {
  // eslint-disable-next-line no-eval
  eval(antiFlickerCode);
}

export function createMatchMediaMock(initialPrefersDark: boolean = false) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  let matches = initialPrefersDark;

  return {
    get matches() {
      return matches;
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn((listener: (e: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeListener: vi.fn((listener: (e: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    ),
    addEventListener: vi.fn((_type: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    dispatchEvent: vi.fn(),
    dispatchOsChange(newPrefersDark: boolean) {
      matches = newPrefersDark;
      const event = {
        matches: newPrefersDark,
        media: '(prefers-color-scheme: dark)',
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}
