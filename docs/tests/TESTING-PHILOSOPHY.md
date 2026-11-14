# Triết lý Kiểm thử Phòng thủ (Defensive Testing Philosophy)

Tài liệu này giải thích bản chất kiến trúc đằng sau 3 tầng kiểm thử tự động (Vitest & Happy-DOM) trong dự án, giúp phân biệt rõ giữa **bảo mật chống tấn công** và **độ bền vững của ứng dụng (Resilience)** trên trình duyệt người dùng.

---

## 1. Phân loại bản chất 3 tầng kiểm thử

Mọi bộ kiểm thử cho các tính năng Frontend trong dự án đều được thiết kế theo 3 cấp độ từ cơ bản đến khắc nghiệt:

- **Tầng 1 — Kiểm thử Chức năng (Functional Testing - `000-*`):** Đảm bảo các luồng UI/UX cốt lõi hoạt động đúng như đặc tả thiết kế (ví dụ: thứ tự ưu tiên dữ liệu, đồng bộ cài đặt hệ điều hành, tương thích vòng đời chuyển trang của Astro).
- **Tầng 2 — Kiểm thử Chịu tải & Thao tác Biên (Edge-Case & Resilience Testing - `001-*`):** Xử lý các tình huống người dùng thao tác nhanh, lệch mục tiêu (click liên tục nhiều lần/giây, bấm nhầm vào thẻ con bên trong nút) hoặc trạng thái DOM bị sai lệch.
- **Tầng 3 — Lập trình Phòng thủ (Defensive Programming - `002-*`):** Các thuật ngữ như _"Tràn bộ nhớ"_, _"Giả mạo dữ liệu"_, hay _"DOM Clobbering"_ thực chất là tên gọi chuyên ngành cho các lỗi môi trường rất hay gặp trên trình duyệt của người dùng thật.

---

## 2. Tại sao Frontend không thể chống hacker tuyệt đối, nhưng vẫn CẦN bộ test này?

Ở kiến trúc Client-Server, mọi mã nguồn gửi xuống trình duyệt đều nằm dưới quyền kiểm soát của người dùng. Việc áp dụng đầy đủ 3 tầng kiểm thử không nhằm tạo ra một pháo đài chống hacker, mà mang lại **4 giá trị thực tế cốt lõi**:

1. **Chống sập web trên các trình duyệt "khó tính" (Resilience):** Nhiều người dùng bật chế độ ẩn danh, dùng trình duyệt chặn cookie/storage (như Brave, Safari chế độ bảo mật cao), hoặc thiết bị đã đầy bộ nhớ. Khi đó trình duyệt sẽ ném ngoại lệ `SecurityError` hoặc `QuotaExceededError`. Bộ test đảm bảo ứng dụng không bị treo cứng mà tự động hạ cấp an toàn (Graceful Degradation) sang bộ nhớ tạm trên RAM.
2. **Ngăn chặn xung đột với Extension và Script bên thứ ba:** Người dùng thường cài nhiều tiện ích mở rộng (dịch thuật, chặn quảng cáo, đổi màu nền...). Các tiện ích này dễ tự ý chèn thẻ HTML lạ (`DOM Clobbering`) hoặc ghi đè dữ liệu rác vào `localStorage` (`Storage Tampering`). Bộ test giúp mã nguồn miễn nhiễm và không phát sinh lỗi vặt do môi trường bên ngoài gây ra.
3. **Chống lỗi hồi quy (Regression Prevention) khi bảo trì:** Khi nâng cấp framework (như Astro) hoặc tái cấu trúc giao diện, chỉ cần chạy một lệnh `npm test`. Toàn bộ các kịch bản phức tạp sẽ tự động kiểm tra trong vài giây để cảnh báo ngay nếu có tính năng cũ bị ảnh hưởng.
4. **Tài liệu sống (Living Documentation) chuẩn mực:** Các file kiểm thử đóng vai trò như bản hướng dẫn kỹ thuật chi tiết và chính xác nhất. Bất kỳ lập trình viên nào đọc vào bộ test cũng nắm bắt được ngay hệ thống đã được thiết kế để chống chịu những tình huống nào.
