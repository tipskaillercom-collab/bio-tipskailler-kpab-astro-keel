# 900: Trợ Năng & Cấu Trúc HTML Semantics (A11y Component Verification)

Tài liệu này định nghĩa chi tiết đặc tả kiểm thử cho tính năng Trợ năng (Accessibility - a11y) và Cấu trúc HTML chuẩn  
ngữ nghĩa (Semantic HTML) của component `ThemeToggle.astro`.

---

## 1. Bối cảnh & Mục đích

Nút bấm chuyển đổi giao diện (Theme Toggle) là một thành phần tương tác quan trọng trên UI. Việc đảm bảo tiêu chuẩn Trợ
năng giúp người dùng sử dụng trình đọc màn hình (Screen Reader), điều hướng bằng bàn phím (Keyboard Navigation), hoặc  
các thiết bị hỗ trợ tiếp cận website một cách mượt mà và không gặp rào cản.

Bộ kiểm thử tại `tests/theme-toggle-feature/900-a11y-component.test.ts` được thiết kế để xác minh 2 nhóm yêu cầu cốt  
lõi:

1. **Cấu trúc HTML Ngữ nghĩa (Semantic HTML):** Đảm bảo component sử dụng đúng thẻ `<button>` chuẩn HTML5 Thay vì các  
   thẻ giả lập như `<div>` hay `<a>`.
2. **Khả năng Trợ năng (Accessibility - a11y):** Đảm bảo gán chính xác `aria-label` cho Screen Reader và ẩn các thẻ  
   icon trang trí bằng `aria-hidden="true"`.

---

## 2. Danh mục Ca Kiểm thử (Test Cases Matrix)

|   STT   | Nhóm Kiểm thử            | Tên Test Case                       | Mô tả / Mục đích kiểm tra                                                                                                  |
| :-----: | :----------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **1.1** | **HTML Semantics**       | Component render thẻ `<button>`     | Xác nhận element có attributes `data-theme-toggle` chính là thẻ `<button>` chuẩn, không phải `<div>` hay `<a>`.            |
| **1.2** | **HTML Semantics**       | Attribute `type="button"`           | Xác nhận nút bấm có chỉ định `type="button"` tường minh để tránh tự động submit form nếu nằm trong thẻ `<form>`.           |
| **2.1** | **Accessibility (a11y)** | `aria-label` truyền từ Props        | Check thuộc tính `aria-label` trên thẻ `<button>` được gán chính xác theo giá trị truyền từ Props `label`.                 |
| **2.2** | **Accessibility (a11y)** | Icon trang trí `aria-hidden="true"` | Check thẻ `<span>` icon bên trong `<button>` chứa thuộc tính `aria-hidden="true"` để trình đọc màn hình không đọc lặp rác. |

---

## 3. Kiến trúc Triển khai Mã Kiểm thử (Test Implementation Standard)

Để render và kiểm thử trực tiếp file Astro Component (`src/components/ThemeToggle.astro`), bộ test sử dụng công cụ  
chính thức `experimental_AstroContainer` từ package `astro/container`.

```typescript
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ThemeToggle from '../../src/components/ThemeToggle.astro';

// Render component ra chuỗi HTML tĩnh để đưa vào DOM kiểm thử
const container = await AstroContainer.create();
const renderedHtml = await container.renderToString(ThemeToggle, {
  props: { label: 'Chuyển đổi giao diện Sáng/Tối' },
});
```
