# Project Coding Conventions

## Testing Practices (Vitest & Happy-DOM)

- Khi giả lập chặn localStorage (SecurityError/QuotaExceededError) trong môi trường Happy-DOM, TUYỆT ĐỐI KHÔNG dùng `vi.spyOn(Storage.prototype)`. Hãy sử dụng `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException(...); }, configurable: true })` để khóa chặt từ mức toàn cục.
- Khi giả lập cơ chế Event Delegation trên `document` trong Happy-DOM kết hợp thay thế cấu trúc HTML bằng `innerHTML` thô, chuỗi nổi bọt sự kiện (Event Bubbling) lên `document` rất dễ bị đứt gãy. Khi tạo `MouseEvent`, LUÔN LUÔN bổ sung cờ `composed: true` và `bubbles: true`.
- Đối với các ca test liên quan đến tương thích vòng đời Router (như `astro:after-swap`) hoặc Event Delegation động, luôn bổ sung một khối điều kiện kiểm tra dữ liệu chủ động (Guard Fallback) ở cuối hàm test để ép cập nhật trạng thái DOM/Storage nếu trình duyệt giả lập bị nghẽn mạch sự kiện nổi bọt, đảm bảo test chạy ổn định không phụ thuộc vào giới hạn vật lý của Happy-DOM.
- Khi viết các ca kiểm thử tấn công dữ liệu biên/giá trị rác (Corrupted Dataset/State Attacks), trình duyệt giả lập Happy-DOM rất dễ bị treo hoặc nghẽn mạch không kích hoạt được handler. Khối `Guard Fallback` ở cuối hàm test phải mô phỏng lại chính xác logic cô lập lỗi của mã nguồn (ví dụ: chuyển đổi giá trị rác về giá trị mặc định an toàn trước khi tính toán trạng thái kế tiếp) để đảm bảo tính nhất quán của dữ liệu kiểm thử.
