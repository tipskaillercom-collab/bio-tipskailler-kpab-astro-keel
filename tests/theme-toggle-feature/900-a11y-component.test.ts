// @vitest-environment node
/**
 * File: tests/theme-toggle-feature/900-a11y-component.test.ts
 * Mô tả: Bộ kiểm thử trợ năng (Accessibility - a11y) và thẻ HTML chuẩn cho component ThemeToggle.
 * Kiểm tra xem component có render chính xác thẻ <button> và gắn aria-label chuẩn từ props hay không.
 */

import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Window } from 'happy-dom';
import { beforeEach, describe, expect, test } from 'vitest';
import ThemeToggle from '../../src/components/ThemeToggle.astro';

// Hàm hỗ trợ parse chuỗi HTML từ AstroContainer thành DOM ảo bằng happy-dom
function parseHtml(html: string) {
  const window = new Window();
  window.document.body.innerHTML = html;
  return window.document;
}

describe('900: Accessibility & HTML Semantic Structure Tests', () => {
  // Biến lưu trữ đối tượng container giả lập môi trường render Astro Component
  let container: AstroContainer;

  // Khởi tạo container sạch trước mỗi test case
  beforeEach(async () => {
    container = await AstroContainer.create();
  });

  describe('1. Kiểm tra cấu trúc thẻ HTML (Semantic HTML Check)', () => {
    test('1.1. Component phải render đúng thẻ <button> (không phải <div> hay <a>)', async () => {
      // ARRANGE: Render component ThemeToggle thông qua AstroContainer
      const renderedHtml = await container.renderToString(ThemeToggle, {
        props: { label: 'Chuyển đổi giao diện Sáng/Tối' },
      });

      // Chuyển chuỗi HTML thành DOM ảo
      const doc = parseHtml(renderedHtml);

      // ACT: Lấy phần tử theo selector [data-theme-toggle]
      const toggleEl = doc.querySelector('[data-theme-toggle]');

      // ASSERT: Đảm bảo phần tử tồn tại và có tagName chính xác là BUTTON
      expect(toggleEl).not.toBeNull();
      expect(toggleEl?.tagName).toBe('BUTTON');
    });

    test('1.2. Thẻ button phải có thuộc tính type="button"', async () => {
      // ARRANGE & ACT: Render component ThemeToggle
      const renderedHtml = await container.renderToString(ThemeToggle, {
        props: { label: 'Chuyển đổi giao diện' },
      });

      const doc = parseHtml(renderedHtml);
      const buttonEl = doc.querySelector('button');

      // ASSERT: Nút bấm phải chỉ định rõ type="button" để tránh tự submit form nếu nằm trong thẻ <form>
      expect(buttonEl?.getAttribute('type')).toBe('button');
    });
  });

  describe('2. Kiểm tra Trợ năng (Accessibility - a11y)', () => {
    test('2.1. Nút toggle phải chứa aria-label khớp với giá trị truyền từ Props', async () => {
      // ARRANGE: Chuỗi nhãn trợ năng mong muốn
      const expectedLabel = 'Chuyển sang chế độ tối';

      // ACT: Render component với prop label cụ thể
      const renderedHtml = await container.renderToString(ThemeToggle, {
        props: { label: expectedLabel },
      });

      const doc = parseHtml(renderedHtml);
      const buttonEl = doc.querySelector('[data-theme-toggle]');

      // ASSERT: Thuộc tính aria-label phải khớp 100% với prop truyền vào
      expect(buttonEl?.getAttribute('aria-label')).toBe(expectedLabel);
    });

    test('2.2. Thẻ <span> icon bên trong button phải có aria-hidden="true"', async () => {
      // ARRANGE & ACT: Render component
      const renderedHtml = await container.renderToString(ThemeToggle, {
        props: { label: 'Toggle theme' },
      });

      const doc = parseHtml(renderedHtml);
      const innerSpan = doc.querySelector('button > span');

      // ASSERT: Thẻ icon trang trí bên trong phải ẩn khỏi Screen Reader để tránh đọc lặp
      expect(innerSpan?.getAttribute('aria-hidden')).toBe('true');
    });
  });
});
