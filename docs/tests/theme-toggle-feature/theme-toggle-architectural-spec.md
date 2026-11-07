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

Yêu cầu mã test phải bao quát toàn bộ 4 kịch bản kiến trúc cốt lõi sau:

1. **Kịch bản Khởi tạo & Ưu tiên (Initial Theme Selection Order):**
   - Lần đầu truy cập (localStorage trống): Hệ thống phải đọc chính xác cấu hình Hệ điều hành thông qua `window.matchMedia('(prefers-color-scheme: dark)')` cho cả hai trường hợp dark và light.
   - Các lần truy cập sau: `localStorage` phải ghi đè hoàn toàn cấu hình Hệ điều hành (ví dụ: OS là light nhưng localStorage lưu dark thì kết quả phải là dark).

2. **Kịch bản Hạ cấp An toàn (Graceful Degradation / RAM Fallback):**
   - Giả lập tình huống trình duyệt chặn quyền truy cập `localStorage` (ném ra ngoại lệ SecurityError khi gọi `getItem` hoặc `setItem`).
   - Kiểm tra xem script Anti-Flicker có tự hạ cấp an toàn về OS preference mà không làm sập ứng dụng hay không.
   - Kiểm tra xem nút bấm tương tác có tự động lưu trạng thái mới vào biến tạm trên RAM (`fallbackRamThemeStorage`) khi click đổi theme trong môi trường bị chặn Storage hay không.

3. **Kịch bản Đồng bộ Động (Live OS Scheme Syncing):**
   - Giả lập hành vi người dùng chưa từng bấm nút toggle (chưa có localStorage). Khi họ thay đổi giao diện ở mức Hệ điều hành (trên Windows/macOS), mã kiểm thử phải kiểm tra xem DOM có tự động cập nhật theo thời gian thực hay không thông qua cơ chế lắng nghe sự kiện của `matchMedia`.

4. **Kịch bản Tương thích Astro ClientRouter (View Transitions):**
   - Giả lập vòng đời chuyển trang của Astro bằng cách kích hoạt sự kiện `astro:after-swap`.
   - Kiểm tra xem hàm Anti-Flicker có được thực thi lại để khôi phục chính xác giá trị `data-theme` trên tag `<html>` mới sau khi hoán đổi DOM hay không.
   - Kiểm tra cơ chế Event Delegation trên `document`: Đảm bảo sau khi đổi trang (DOM cũ bị hủy, nút bấm mới được chèn vào), bộ lắng nghe sự kiện click ở mức document vẫn bắt được hành động click vào phần tử `[data-theme-toggle]` mới và chuyển đổi giao diện chính xác.

Yêu cầu thiết lập môi trường mock cẩn thận cho `window.matchMedia`, `localStorage`, và các sự kiện custom của Astro trước mỗi ca kiểm thử (`beforeEach`), dọn dẹp sạch sẽ sau mỗi ca (`afterEach`). Không viết mã giả, viết code thực thi được 100% bằng Strict TypeScript.
```
