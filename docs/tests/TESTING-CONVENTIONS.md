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
