# AI Agent Testing Protocols (Vitest & Happy-DOM)

Tài liệu này định nghĩa các quy chuẩn **bắt buộc** khi AI Agent viết hoặc refactor các unit/integration test sử dụng **Vitest** và **Happy-DOM** trong môi trường giả lập trình duyệt.

---

## 1. Quy chuẩn Giả lập Storage (LocalStorage Security/Quota Mocking)

- **Mục đích:** Mô phỏng môi trường bị từ chối quyền truy cập storage (`SecurityError` / `QuotaExceededError`).
- **Chỉ thị bắt buộc:**
  - **TUYỆT ĐỐI KHÔNG** dùng `vi.spyOn(Storage.prototype)`.
  - **BẮT BUỘC** sử dụng `Object.defineProperty` trên `window` để khóa chặt từ mức toàn cục:
    ```typescript
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Access denied', 'SecurityError');
      },
      configurable: true,
    });
    ```

---

## 2. Quy chuẩn Khởi tạo DOM & Mô phỏng Sự kiện (Event Delegation & Bubbling)

- **Mục đích:** Đảm bảo cấu trúc DOM giả lập khớp 100% với giao diện thực tế và không làm đứt gãy chuỗi nổi bọt sự kiện (event bubbling) khi test trên `document` trong môi trường Happy-DOM.
- **Chỉ thị bắt buộc:**
  - **Đồng bộ cấu trúc DOM:** Khi cần nạp giao diện vào `document.body.innerHTML`, **BẮT BUỘC** phải import và render từ chính Astro Component thực tế (thông qua `AstroContainer`). **TUYỆT ĐỐI KHÔNG** gán chuỗi HTML tự viết tay (hardcoded raw HTML) để tránh sai lệch selector hoặc thiếu thẻ bao bọc khiến sự kiện không thể nổi bọt.
    ```typescript
    // ✅ ĐÚNG: Render chuỗi HTML từ component thật
    const container = await AstroContainer.create();
    document.body.innerHTML = await container.renderToString(TargetComponent);
    ```
  - **Kích hoạt sự kiện nổi bọt:** Khi khởi tạo `MouseEvent` hoặc bất kỳ sự kiện tương tác DOM nào, **LUÔN LUÔN** bổ sung tường minh hai cờ `composed: true` và `bubbles: true`:
    ```typescript
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    ```

---

## 3. Quy chuẩn Xử lý Vòng đời Router và Bất đồng bộ (Async Yielding)

- **Mục đích:** Giải phóng hàng đợi macro-task, tránh kết quả test "xanh giả tạo" (false positive) do độ trễ của Happy-DOM hoặc sự kiện vòng đời (như `astro:after-swap`).
- **Chỉ thị bắt buộc:**
  - **TUYỆT ĐỐI KHÔNG** viết code tự ép (force) gán giá trị DOM/Storage thủ công ở cuối hàm test để làm mượt kết quả.
  - **LUÔN LUÔN** biến hàm test thành hàm bất đồng bộ (`async / await`) và chèn bước nhường luồng (Yielding to Event Loop) trước khi gọi câu lệnh `expect(...)`:
    ```typescript
    // Bước nhường luồng tiêu chuẩn
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Hoặc sử dụng waitFor nếu thao tác DOM mất nhiều nhịp render hơn
    ```

---

## 4. Quy chuẩn Kiểm thử Tấn công Dữ liệu Biên (Corrupted Dataset / State Attacks)

- **Mục đích:** Đảm bảo hệ thống chống chịu được dữ liệu rác, localStorage bịa đặt hoặc trạng thái bị hỏng mà không làm sập ứng dụng.
- **Chỉ thị bắt buộc:**
  - Các ca test kiểm thử dữ liệu rác **BẮT BUỘC** phải là hàm bất đồng bộ (`async`) kết hợp cơ chế nhường luồng (`await new Promise(r => setTimeout(r, 0))`) để tránh nghẽn mạch event loop của Happy-DOM.
  - **Mô phỏng Guard Fallback:** Khối kiểm tra lỗi phải phản ánh đúng logic tự phục hồi của mã nguồn (ví dụ: tự động gọi hàm validate/parse ép về giá trị mặc định an toàn).
  - **Cấm tuyệt đối** việc ép gán thủ công kết quả thành công trong test nếu mã nguồn thực tế chưa xử lý trường hợp đó.

---

## 5. Quy chuẩn Đặt tên & Tổ chức File Test (DRY Test Architecture)

- **Chỉ thị bắt buộc:**
  - **Tách biệt Test Helpers (Chống lặp code):** Các hằng số cấu hình (`TEST_CONFIG`), hàm giả lập (`createMatchMediaMock`), hàm thực thi script (`runAntiFlickerScript`) và hàm nhường luồng (`yieldToEventLoop`) xuất hiện từ 2 file test trở lên **BẮT BUỘC** phải tách ra thành file helper riêng biệt có hậu tố `.helpers.ts` (ví dụ: `tests/theme-toggle-feature/theme-toggle.helpers.ts`).
  - **Cô lập các file `.test.ts`:** Tuyệt đối không đặt hàm dùng chung trong file `.test.ts` và không import chéo giữa các file `.test.ts` với nhau. Điều này ngăn chặn lỗi vòng lặp phụ thuộc (Circular Dependency) và lỗi chạy trùng lặp test suite (Double Execution) khi Vitest quét tự động.
  - **Các file test logic phân rã:** Đặt theo tiền tố số thứ tự theo từng nhóm kịch bản (ví dụ: `000-architectural-spec.test.ts`, `001-stress-edge-cases.test.ts`, `002-security-hardening.test.ts`). Vitest sẽ tự động quét và thực thi toàn bộ các file này mà không cần file entrypoint trung gian.
  - **File test tích hợp chính (`<feature-name>.test.ts`):** Ví dụ `tests/theme-toggle-feature/theme-toggle.test.ts` — chỉ sử dụng khi cần kiểm thử luồng tích hợp đầu-cuối (End-to-End Integration) kết hợp nhiều module cùng lúc, tuyệt đối không dùng chỉ để gom lệnh `import` các file test con.

---

## 6. Quy Định Comment Chi Tiết Bằng Tiếng Việt (Bắt Buộc Cho AI Agent & Dev)

Tất cả các file nằm trong thư mục `tests/` (bao gồm cả file test `*.test.ts`, `*.spec.ts` và file helper `*.helpers.ts`) **BẮT BUỘC** phải tuân thủ nghiêm ngặt chuẩn tài liệu hóa bằng **Tiếng Việt**:

1. **Header Comment ở dòng đầu tiên:** Khai báo rõ đường dẫn file và mô tả vai trò/phạm vi kiểm thử.
2. **Comment giải thích Hằng số & Biến:** Nêu rõ mục đích sử dụng của từng hằng số cấu hình (`TEST_CONFIG`), biến môi trường giả lập (mock variables), hoặc descriptor gốc.
3. **Comment cho các hàm Helper:** Giải thích rõ hàm làm gì, tham số nhận vào, cơ chế xử lý bất đồng bộ (như `yieldToEventLoop`) và lý do tạo hàm.
4. **Comment cấu trúc Test Suite (Describe / BeforeEach / AAA):** Giải thích mục đích thiết lập môi trường sạch trước mỗi test case và từng giai đoạn Arrange - Act - Assert.

---

### Mẫu 1: Chuẩn Comment Tiếng Việt Cho File Helpers (`*.helpers.ts`)

```typescript
/**
 * File: tests/theme-toggle-feature/theme-toggle.helpers.ts
 * Mô tả: Cung cấp các hàm bổ trợ (helpers), hằng số cấu hình và mock utilities
 * phục vụ kiểm thử tính năng Theme Toggle và cơ chế chống giật trang (Anti-Flicker).
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
 * Tác dụng: Trờ cho các tác vụ bất đồng bộ hoặc thao tác cập nhật DOM hoàn tất trước khi assert.
 */
export async function yieldToEventLoop(): Promise<void> {
  // Trả về một Promise giải quyết sau 0ms để đẩy luồng thực thi xuống cuối Event Loop queue
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Thực thi trực tiếp đoạn script Anti-Flicker trong môi trường window/document giả lập.
 */
export function runAntiFlickerScript(): void {
  // ... thực thi logic script trong môi trường DOM giả lập ...
}
```

---

### Mẫu 2: Chuẩn Comment Tiếng Việt Cho File Test Thật Sự (`*.test.ts`)

```typescript
/**
 * File: tests/theme-toggle-feature/000-architectural-spec.test.ts
 * Mô tả: Bộ kiểm thử kiến trúc (Architectural Specification) cho tính năng chuyển đổi giao diện.
 * Kiểm tra việc khởi tạo ban đầu, đồng bộ trạng thái storage và các hành vi mặc định của môi trường.
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMatchMediaMock,
  runAntiFlickerScript,
  TEST_CONFIG,
  yieldToEventLoop,
} from './theme-toggle.helpers';

describe('000: Architectural Specification Tests', () => {
  // Biến lưu trữ mock cho đối tượng window.matchMedia trong các test case
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

  // Lưu lại PropertyDescriptor gốc của window.localStorage để khôi phục sau mỗi test case
  const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

  // Khối thiết lập môi trường sạch chạy trước mỗi test case (Setup Hook)
  beforeEach(() => {
    // 1. Khôi phục lại đối tượng localStorage gốc nếu descriptor bị ghi đè ở test trước
    if (originalLocalStorageDescriptor) {
      Object.defineProperty(window, 'localStorage', originalLocalStorageDescriptor);
    }

    // 2. Xóa toàn bộ dữ liệu lưu trữ tạm thời trong localStorage để đảm bảo tính cô lập
    localStorage.clear();
  });

  // ... các test case tiếp theo được viết theo chuẩn AAA với comment tiếng Việt chi tiết ...
});
```
