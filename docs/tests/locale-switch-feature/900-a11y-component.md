# 900: Trợ Năng & Cấu Trúc HTML Semantics (Locale Switch A11y Verification)

Tài liệu này định nghĩa chi tiết đặc tả kiểm thử cho tính năng Trợ năng (Accessibility - a11y) và Cấu trúc  
HTML chuẩn ngữ nghĩa (Semantic HTML) của component `LocaleToggle.astro`.

---

## 1. Bối cảnh & Mục đích

Nút bấm chuyển đổi ngôn ngữ (`LocaleToggle.astro`) là thành phần tương tác quan trọng trên Navigation Header.
Việc đảm bảo tiêu chuẩn Trợ năng giúp người dùng sử dụng trình đọc màn hình (Screen Reader), điều hướng bằng  
bàn phím (Keyboard Navigation), hoặc các thiết bị hỗ trợ tiếp cận tiếp nhận thông tin chính xác.

Bộ kiểm thử tại `tests/locale-switch-feature/900-a11y-component.test.ts` xác minh 2 nhóm yêu cầu cốt lõi:

1. **Cấu trúc HTML Ngữ nghĩa (Semantic HTML):** Đảm bảo component render đúng thẻ `<button>` chuẩn HTML5 có  
   thuộc tính `type="button"` tường minh và chứa attribute nhận diện `data-locale-toggle`.
2. **Khả năng Trợ năng (Accessibility - a11y):** Đảm bảo nút chứa thuộc tính `aria-label` hợp lý và phần đồ  
   họa phức tạp SVG lá cờ được ẩn hoàn toàn khỏi Screen Reader bằng `aria-hidden="true"`.

---

## 2. Danh mục Ca Kiểm thử (Test Cases Matrix)

| STT     | Nhóm Kiểm thử            | Tên Test Case                       | Mô tả / Mục đích kiểm tra                                                                                                   |
| :------ | ------------------------ | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **1.1** | **HTML Semantics**       | Component render thẻ `<button>`     | Xác nhận element có thuộc tính `data-locale-toggle` chính là thẻ `<button>` chuẩn, không phải `<div>` hay `<a>`.            |
| **1.2** | **HTML Semantics**       | Attribute `type="button"`           | Xác nhận nút bấm chỉ định `type="button"` tường minh để tránh tự động submit form nếu nằm trong thẻ `<form>`.               |
| **2.1** | **Accessibility (a11y)** | `aria-label` truyền từ Props        | Check thuộc tính `aria-label` trên thẻ `<button>` được gán chính xác theo giá trị truyền từ prop `label` (mặc định/custom). |
| **2.2** | **Accessibility (a11y)** | Đồ họa SVG `aria-hidden="true"`     | Check thẻ `<svg>` hình quạt lá cờ bên trong `<button>` chứa thuộc tính `aria-hidden="true"` để Screen Reader không đọc rác. |
| **2.3** | **Accessibility (a11y)** | Render đủ SVG ClipPath theo Locales | Kiểm tra số lượng thẻ `<clipPath>` và nhóm `<g>` trong SVG match đúng với số lượng phần tử của mảng `locales`.              |

---

## 3. Kiến trúc Triển khai Mã Kiểm thử (Test Implementation Standard)

Để render và kiểm thử trực tiếp file Astro Component (`src/components/LocaleToggle.astro`), bộ test sử dụng  
công cụ `experimental_AstroContainer` từ package `astro/container`.

```typescript
/**
 * File: tests/locale-switch-feature/900-a11y-component.test.ts  
 * Mô tả: Kiểm thử Trợ năng (a11y) và Semantics HTML cho component LocaleToggle.astro  
 */
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import { Window } from 'happy-dom';
import LocaleToggle from '../../src/components/LocaleToggle.astro';

const parseHTML = (html: string) => {
  const window = new Window();
  return new window.DOMParser().parseFromString(html, 'text/html');
};

describe('900: LocaleToggle Accessibility & Semantics Tests', () => {
  test('1.1 & 1.2: Render đúng thẻ button chuẩn HTML5', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LocaleToggle, {
      props: { label: 'Switch language' },
    });

    const doc = parseHTML(html);
    const button = doc.querySelector('[data-locale-toggle]');

    expect(button).not.toBeNull();
    expect(button?.tagName.toLowerCase()).toBe('button');
    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('aria-label')).toBe('Switch language');
  });
});
```
