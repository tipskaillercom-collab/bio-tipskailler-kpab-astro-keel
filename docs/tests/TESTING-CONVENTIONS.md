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

## 2. Quy chuẩn Mô phỏng Sự kiện (Event Delegation & Bubbling)

- **Mục đích:** Tránh đứt gãy chuỗi nổi bọt sự kiện khi test trên `document` kết hợp với `innerHTML` thô trong Happy-DOM.
- **Chỉ thị bắt buộc:**
  - Khi khởi tạo `MouseEvent` hoặc bất kỳ sự kiện tương tác DOM nào, **LUÔN LUÔN** bổ sung tường minh hai cờ `composed: true` và `bubbles: true`:
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

## 5. Quy chuẩn Đặt tên File Test

- **Chỉ thị bắt buộc:**
  - Các file test logic phụ trợ / đặc tả kiến trúc: Đặt theo tiền tố số thứ tự (ví dụ: `000-architectural-spec.test.ts`, `001-stress-edge-cases.test.ts`).
  - **File test chính (Main Feature Test):** Bắt buộc phải đặt tên theo định dạng gốc của tính năng, ví dụ: `theme-toggle.test.ts` nằm trong thư mục `tests/theme-toggle-feature/`.
