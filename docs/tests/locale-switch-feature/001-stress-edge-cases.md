# AI QA System Prompt - Locale Switch Stress Testing & Edge Case Mutation

## 🎯 Target Files

- Component UI: `src/components/LocaleToggle.astro`
- Logic Core: `src/helpers/locale-switch/locale-switch.js`
- Client Toggler: `src/scripts/locale-switch/locale-switch-toggler.ts`
- Test Output: `tests/locale-switch-feature/001-stress-edge-cases.test.ts`

## 🧠 System Context & Stress Prompts

### 🚀 Prompt Phase 2: Stress Test & Edge Case Mutation

> [!IMPORTANT]  
> Sao chép và dán toàn bộ đoạn lệnh dưới đây vào terminal để ép AI kiểm thử các ca đột biến và thao tác biên  
> khắc nghiệt trên DOM.

```text
Hãy tạo file `tests/locale-switch-feature/001-stress-edge-cases.test.ts` chứa các ca kiểm thử nâng cao (Stress
Test) nhằm tấn công vào điểm yếu vật lý và logic xử lý URL/DOM của tính năng Locale Switch:

1. **Tấn công Event Delegation (Deep Nested DOM Targets):**
   - Kích hoạt sự kiện click vào một thẻ `<path>` hoặc `<g>` nằm sâu bên trong nút bấm `<button
data-locale-toggle>`. Kiểm tra xem hàm `event.target.closest('[data-locale-toggle]')` có nhận diện đúng nút
cha và kích hoạt đổi ngôn ngữ hay không.
   - Click vào một phần tử ngẫu nhiên không thuộc nút đổi ngôn ngữ (Ví dụ: `<p>` hoặc `<a>`). Đảm bảo hệ thống
bỏ qua và KHÔNG thay đổi `localStorage` hay thực hiện điều hướng.

2. **Tấn công Đua trạng thái (Rapid Sequential Clicks / Race Conditions):**
   - Giả lập hành vi người dùng click liên tục 6-9 lần với tốc độ cực nhanh vào nút đổi ngôn ngữ.
   - Kiểm tra tính nhất quán của vòng xoay ngôn ngữ (`STEP_2_DETERMINE_NEXT_LOCALE`): Đảm bảo ngôn ngữ cuối
cùng được tính toán đảo đúng theo modulo danh sách `locales` và URL đích được tạo chính xác mà không bị lệch
nhịp.

3. **Tấn công URL Đột biến (Corrupted Path Segments & Malformed Query/Hash):**
   - Kiểm tra hàm `helpers.buildPath` khi URL chứa nhiều dấu gạch chéo lặp thừa (Ví dụ:
`///vi///blog//post-1`), kèm query phức tạp (`?ref=facebook&sort=asc`) và hash (`#comments`).
   - Kiểm tra xem kết quả URL mới có được làm sạch trùng lặp gạch chéo (sanitized) nhưng vẫn bảo toàn nguyên
vẹn chuỗi query và hash hay không.
   - Giả lập URL có phân đoạn locale không nằm trong danh sách hỗ trợ (Ví dụ: `/fr/about`). Kiểm tra xem
`getCurrentLocale` có hạ cấp an toàn về `defaultLocale` mà không làm vỡ mảng path segments.

Đảm bảo tất cả MouseEvent động đều bổ sung cờ `bubbles: true` và `composed: true`. Comment giải thích rõ ràng
bằng Tiếng Việt theo chuẩn CONVENTIONS.md.
```
