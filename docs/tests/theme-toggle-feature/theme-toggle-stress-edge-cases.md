# AI QA System Prompt - Theme Toggle Stress Testing & Edge Case Mutation

## 🎯 Target Files

- Component UI: `src/components/ThemeToggle.astro`
- Logic Script: `src/scripts/theme/theme-toggle.ts`
- Anti-Flicker: `public/scripts/theme-init-anti-flicker.js`
- Test Output: `tests/theme-toggle.test.ts`

## 🧠 System Context & Stress Prompts

### 🚀 Prompt Phase 2: Stress Test & Edge Case Mutation

> [!IMPORTANT]
> Sao chép và dán toàn bộ đoạn lệnh dưới đây vào terminal của Aider (`>`) sau khi đã hoàn thành bộ test kiến trúc để ép AI tìm và diệt các lỗ hổng DOM tiềm ẩn.

```text
Hãy nâng cấp file `tests/theme-toggle.test.ts` bằng cách bổ sung các ca kiểm thử nâng cao (Stress Test) nhằm tấn công vào các điểm yếu vật lý và logic của DOM:

1. **Tấn công Event Delegation (DOM Mutation & Selector Stress):**
   - Người dùng không click trúng thẻ `<button>` mà click trúng thẻ con rỗng bên trong `<span>` nằm trong nút bấm `[data-theme-toggle]`. Kiểm tra xem hàm `event.target.closest` có hoạt động chính xác để kích hoạt đổi theme không.
   - Click vào một phần tử ngẫu nhiên không có thuộc tính `data-theme-toggle` (ví dụ một thẻ `<p>` ngẫu nhiên). Đảm bảo giao diện KHÔNG bị thay đổi trạng thái.

2. **Tấn công Đua trạng thái (Race Conditions & Rapid Clicks):**
   - Giả lập hành vi người dùng click liên tục 5-10 lần với tốc độ cực nhanh vào nút đổi theme. Kiểm tra xem cơ chế tính toán dựa trên tính Bất biến (Immutability) ở `STEP_2_CALCULATE_NEXT_THEME` có đảm bảo theme cuối cùng đảo chiều chính xác theo số lần click chẵn/lẻ hay không, không bị lệch trạng thái DOM.

3. **Độc trị thuộc tính dataset (Corrupted Dataset Attack):**
   - Giả lập trường hợp thuộc tính `document.documentElement.dataset.theme` bị gán một giá trị rác hoặc không hợp lệ (ví dụ: `"invalid-theme"`, `""`, hoặc `undefined`).
   - Kiểm tra xem hàm `STEP_1_GET_CURRENT_THEME` có tự động cô lập lỗi và hạ cấp an toàn (fallback) về giá trị mặc định `"light"` thay vì làm hỏng logic của phiên click tiếp theo không.

Đủ các yếu tố trên và đảm bảo tuân thủ nghiêm ngặt các quy tắc trong CONVENTIONS.md (như bổ sung `composed: true`, `bubbles: true` khi giả lập MouseEvent động và sử dụng Guard Fallback nếu happy-dom nghẽn mạch) để toàn bộ mã viết thêm chạy mượt mà trên happy-dom và ăn đèn xanh 100%.
```
