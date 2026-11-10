# AI QA System Prompt - Theme Toggle Architectural Specification

## 🎯 Target Files

- Component UI: `src/components/ThemeToggle.astro`
- Logic Script: `src/scripts/theme/theme-toggle.ts`
- Anti-Flicker: `public/scripts/theme-init-anti-flicker.js`
- Test Output: `tests/theme-toggle.test.ts`

## 🧠 System Context & Architectural Prompts

### 🚀 Prompt Phase 1: Deep Architectural & Spec Test

> [!IMPORTANT]
> Sao chép và dán toàn bộ đoạn lệnh dưới đây vào terminal của Aider (`>`) để kích hoạt AI tự lập trình kịch bản test kiến trúc.

```text
Hãy đóng vai trò là một Senior Software Engineer in Test. Phân tích tài liệu kiến trúc Theme Toggle đã cung cấp và tự động tạo toàn bộ các ca kiểm thử chuyên sâu (Production-Ready) bằng Vitest và Happy-DOM vào file `tests/theme-toggle.test.ts`.

Yêu cầu mã test phải bao quát toàn diện và không bỏ sót các trường hợp biên của 4 kịch bản kiến trúc cốt lõi sau:

1. **Kịch bản Khởi tạo & Ưu tiên (Initial Theme Selection Order):**

- Lần đầu truy cập (localStorage trống): Hệ thống phải đọc chính xác cấu hình Hệ điều hành thông qua `window.matchMedia('(prefers-color-scheme: dark)')` cho cả hai trường hợp dark và light độc lập.
- Các lần truy cập tiếp theo (Đồng nhất & Ghi đè):
  - Trường hợp localStorage và OS trùng khớp hoàn toàn (`localStorage = 'dark'` & `OS = dark`, hoặc `localStorage = 'light'` & `OS = light`): `data-theme` phải phản ánh chính xác giá trị đó.
  - Trường hợp xung đột (`localStorage = 'dark'` nhưng `OS = light`, hoặc ngược lại): `localStorage` bắt buộc phải ghi đè hoàn toàn cấu hình Hệ điều hành.

2. **Kịch bản Hạ cấp An toàn (Graceful Degradation / RAM Fallback):**

- Giả lập tình huống trình duyệt chặn quyền truy cập `localStorage` (ném ra ngoại lệ `SecurityError` khi gọi `getItem` hoặc `setItem`).
- Kiểm tra xem script Anti-Flicker có tự hạ cấp an toàn về OS preference mà không làm sập ứng dụng (không throw unhandled error) hay không.
- Kiểm tra xem nút bấm tương tác có tự động lưu trạng thái mới vào biến tạm trên RAM (`fallbackRamThemeStorage`) khi click đổi theme trong môi trường bị chặn Storage hay không, đồng thời xác thực sự tồn tại của thông báo `console.warn` tương ứng.

3. **Kịch bản Đồng bộ Động (Live OS Scheme Syncing):**

- Giả lập hành vi người dùng chưa từng bấm nút toggle (chưa có localStorage). Khi họ thay đổi giao diện ở mức Hệ điều hành (trên Windows/macOS), mã kiểm thử phải kiểm tra xem DOM (`data-theme`) có tự động cập nhật theo thời gian thực hay không thông qua cơ chế lắng nghe sự kiện `change` của `matchMedia`.
- Trường hợp đã có `localStorage`: Khi OS thay đổi theme, DOM phải giữ nguyên trạng thái do người dùng đã chủ động chọn, không bị ghi đè bởi OS.

4. **Kịch bản Tương thích Astro ClientRouter (View Transitions):**

- Giả lập vòng đời chuyển trang của Astro bằng cách kích hoạt sự kiện `astro:after-swap`.
- Kiểm tra xem hàm Anti-Flicker có được thực thi lại để khôi phục chính xác giá trị `data-theme` trên tag `<html>` mới sau khi hoán đổi DOM hay không.
- Kiểm tra cơ chế Event Delegation trên `document`: Đảm bảo sau khi đổi trang (DOM cũ bị hủy, nút bấm mới được chèn vào), bộ lắng nghe sự kiện click ở mức document vẫn bắt được hành động click vào phần tử `[data-theme-toggle]` mới và chuyển đổi giao diện chính xác.

Yêu cầu thiết lập môi trường mock cẩn thận cho `window.matchMedia`, `localStorage`, và các sự kiện custom của Astro trước mỗi ca kiểm thử (`beforeEach`), dọn dẹp sạch sẽ sau mỗi ca (`afterEach`). Không viết mã giả, viết code thực thi được 100% bằng Strict TypeScript, tuân thủ nghiêm ngặt các quy định về cú pháp async yielding khi tương tác với Happy-DOM.
```
