# AI Agent Feature Coding Directives (Mandatory Standards)

Tài liệu này định nghĩa các quy tắc **bắt buộc** mà AI Agent phải tuân thủ tuyệt đối khi viết code, xây dựng tính năng, component và refactor trong toàn bộ dự án.

---

## 1. Kiến trúc Code & Phong cách Lập trình (Step Functions & Strict Types)

- **Step Functions:** Mọi logic xử lý phức tạp **BẮT BUỘC** phải được bóc tách thành các hàm tuần tự theo bước rõ ràng (`STEP_1_...`, `STEP_2_...`, `STEP_3_...`) giống như phong cách thiết kế Anti-Flicker và Theme Toggle.
- **Strict Typing:** Các file được phép dùng type/interface (như `.ts` hoặc phần Frontmatter của `.astro`) phải tuân thủ nghiêm ngặt kiểu dữ liệu, không dùng kiểu `any` tùy tiện.
- **Error Handling & Console Logging:**
  - Luôn bọc các thao tác rủi ro (localStorage, DOM manipulation bất đồng bộ, API calls) trong khối `try...catch`.
  - **LUÔN DÙNG** các hàm `console` (`console.log`, `console.info`, `console.warn`, `console.error`) kèm theo tiền tố module cụ thể (ví dụ: `[Theme Toggle]`) để xuất thông tin ra console, giúp việc debug sau này dễ dàng.

---

## 2. Quy tắc Tái sử dụng Code (DRY - Don't Repeat Yourself)

- **Ngưỡng 2 lần:** Bất kỳ đoạn code logic nào xuất hiện từ **2 lần trở lên**, AI Agent **BẮT BUỘC** phải trích xuất (extract) thành một hàm độc lập.
- **Quy tắc phân rã thư mục Helpers:**
  - **Helper cho tính năng ứng dụng (Production):** Đặt vào thư mục riêng của tính năng đó trong `src/helpers/` (ví dụ: `src/helpers/locale-switch/`), hoặc đặt trực tiếp tại `src/helpers/` nếu dùng chung toàn cục.
  - **Helper phục vụ kiểm thử (Test Helpers):** Đặt ngay trong thư mục test của tính năng đó và **BẮT BUỘC** dùng hậu tố `.helpers.ts` (ví dụ: `tests/theme-toggle-feature/theme-toggle.helpers.ts`). _(Xem chi tiết quy tắc tổ chức file test tại `docs/tests/TESTING-CONVENTIONS.md`)_.

---

## 3. Quản lý Component & Giao diện

- **Componentization:** Tách nhỏ giao diện thành các Astro Component độc lập, dễ quản lý và tái sử dụng (áp dụng cho cả code chính lẫn code test giao diện). Trong file test, không tự viết chuỗi HTML giả lập (hardcode HTML) mà phải import và sử dụng chính component đó để đảm bảo tính đồng nhất.
- **Chú thích tiếng Việt:** Mọi hàm, component, và các bước logic chính **BẮT BUỘC** phải có chú thích (comment) giải thích chi tiết bằng **tiếng Việt** rõ ràng, dễ hiểu.

---

## 4. Tiêu Chuẩn Header Comment (Comment Đầu File)

Tất cả các file mã nguồn (`.ts`, `.js`, `.css`, `.html`, v.v.) bắt buộc phải khai báo khối comment ngay tại dòng đầu tiên của file để làm rõ cấu trúc và mục đích sử dụng.

```javascript
/**
 * File: public/scripts/theme-init-anti-flicker.js
 * Mô tả: Script tĩnh thực thi đồng bộ trước khi trình duyệt render giao diện (Anti-Flicker).
 */
```

---

## 5. Tiêu Chuẩn Viết Code Cơ Bản

- **Comment chi tiết bằng Tiếng Việt (Bắt buộc đối với AI Agent & Lập trình viên):**
  - Mọi hàm, class, interface, biến phức tạp và từng bước xử lý logic **BẮT BUỘC** phải có comment giải thích chi tiết bằng **Tiếng Việt**.
  - Không viết comment qua loa, chung chung. Comment phải nêu rõ: **Mục đích**, **Đầu vào/Đầu ra**, và **Lý do xử lý logic** đó.
- **Type/Interface tường minh:** Luôn khai báo kiểu dữ liệu tường minh (strict typing) cho tất cả các biến...
