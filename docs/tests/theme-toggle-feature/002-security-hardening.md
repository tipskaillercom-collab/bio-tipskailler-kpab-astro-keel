# AI QA System Prompt - Theme Toggle Security Hardening & Threat Mitigation

## 🎯 Target Files

- Component UI: `src/components/ThemeToggle.astro`
- Logic Script: `src/scripts/theme/theme-toggle.ts`
- Anti-Flicker: `public/scripts/theme-init-anti-flicker.js`
- Test Output: `tests/theme-toggle.test.ts` (hoặc module bảo mật chuyên biệt)

## 🧠 System Context & Security Prompts

### 🚀 Prompt Phase 3: Security Hardening & Threat Mitigation Testing

> [!IMPORTANT]
> Sao chép và dán toàn bộ đoạn lệnh dưới đây vào terminal của Aider (`>`) để kiểm tra khả năng chống chịu trước các cuộc tấn công cấp độ hệ thống.

```text
Hãy bổ sung các ca kiểm thử bảo mật nâng cao (Security Hardening & Threat Mitigation Tests) vào bộ kiểm thử hệ thống theme:

1. **Tấn công Tràn bộ nhớ / Storage Quota Exceeded (Denial of Service Mitigation):**
- Giả lập tình huống `localStorage.setItem` ném ra ngoại lệ `QuotaExceededError` do bộ nhớ trình duyệt đã cạn kiệt.
- Kiểm tra xem hệ thống có kích hoạt cơ chế `try...catch` mượt mà, chuyển hướng sang lưu trữ tạm thời trên RAM (`fallbackRamThemeStorage`) và không làm treo ứng dụng hay crash giao diện người dùng.

2. **Tấn công Giả mạo Dữ liệu Lưu trữ (Storage Tampering & Malformed Data):**
- Tiêm nhiễm (Inject) các giá trị độc hại, xám xịt hoặc script giả mạo vào `localStorage` (ví dụ: `localStorage.setItem('theme', '<script>alert(1)</script>')` hoặc `localStorage.setItem('theme', 'undefined')`).
- Kiểm tra xem hệ thống khởi tạo (Anti-Flicker) và logic đọc theme có tự động lọc bỏ (Sanitize) hoặc hạ cấp an toàn về giá trị chuẩn (`light`/`dark`) hay không, vô hiệu hóa hoàn toàn mã độc tiềm ẩn.

3. **Tấn công DOM Clobbering (Global Variable & Element Hijacking):**
- Kẻ tấn công cố tình chèn các phần tử HTML có thuộc tính `id` hoặc `name` trùng lặp với các biến toàn cục hoặc cấu trúc định danh của theme (ví dụ: `<div id="theme"></div>` hoặc cố gắng đè cấu trúc `dataset`).
- Kiểm tra xem hệ thống truy vấn DOM qua `document.documentElement.dataset` có miễn nhiễm hoàn toàn trước kỹ thuật DOM Clobbering hay không.

Đảm bảo mọi ca kiểm thử bảo mật đều sử dụng Strict TypeScript, tuân thủ nghiêm ngặt async yielding, bắt ngoại lệ tường minh và đạt độ ổn định 100% trong môi trường Happy-DOM.
```
