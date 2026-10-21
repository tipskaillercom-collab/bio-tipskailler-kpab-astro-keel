# Security Audit & Content Security Policy (CSP) Report

- **Ngày thực hiện:** 2026-10-21
- **Tên miền mục tiêu:** `[your-domain.com]`
- **Môi trường triển khai:** HestiaCP (Nginx Server-level) + Astro SSG

---

## 1. Giới thiệu & Mục tiêu

Báo cáo này đánh giá việc tải các tài nguyên nội bộ và ngoại vi trong dự án Astro SSG, đồng thời cung cấp bộ quy tắc HTTP Security Headers và Content Security Policy (CSP) hoàn chỉnh ở cấp độ máy chủ Nginx (HestiaCP) nhằm phòng tránh các nguy cơ:

- Cross-Site Scripting (XSS)
- Clickjacking / UI Redressing
- Reverse Tabnabbing & Data Injection
- MIME-sniffing vulnerabilities

---

## 2. Rà soát tài nguyên ngoại vi trong mã nguồn

### 2.1. Phông chữ và Stylesheet

- **Nội bộ:** Dự án sử dụng các font self-hosted qua npm (`@fontsource-variable/fraunces`, `@fontsource/public-sans`, `@fontsource-variable/jetbrains-mono`).
- **Ngoại vi hỗ trợ:** Cấu hình CSP mở rộng hỗ trợ thêm Google Fonts (`https://fonts.googleapis.com`, `https://fonts.gstatic.com`) phục vụ cho các font nhúng bổ sung.

### 2.2. Scripts & Iframe bên ngoài

- **Giscus Comments (`src/components/Comments.astro`):**
  - Tải script từ: `https://giscus.app/client.js`
  - Nhúng frame thảo luận từ: `https://giscus.app`
  - Kết nối dữ liệu / analytics tới: `https://giscus.app`

### 2.3. Inline Scripts & Styles

- Astro sử dụng các script nhỏ inline cho việc xử lý theme toggle và View Transitions (`<script is:inline>`).
- Syntax highlighter (Shiki) và Astro styles sử dụng inline styles, do đó chỉ thị `style-src` cần cờ `'unsafe-inline'`.

---

## 3. Cấu hình HTTP Security Headers & CSP trên Nginx (HestiaCP)

Để cấu hình bảo mật không bị ghi đè khi HestiaCP rebuild domain, tạo hoặc chỉnh sửa file cấu hình tùy biến:

- **Đường dẫn file trên server:** `/home/[username]/conf/web/[your-domain.com]/nginx.conf_security`

```nginx
# ==========================================
# HTTP Security Headers cho [your-domain.com]
# ==========================================

# 1. HTTP Strict Transport Security (HSTS)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# 2. Ngăn chặn clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# 3. Chống MIME-sniffing
add_header X-Content-Type-Options "nosniff" always;

# 4. Kiểm soát thông tin Referrer khi chuyển tiếp liên kết
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 5. Hạn chế các API nhạy cảm của trình duyệt
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), fullscreen=(self)" always;

# 6. Content Security Policy (CSP) hỗ trợ Astro SSG, Giscus Comments và Google Fonts
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://giscus.app; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://giscus.app; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://giscus.app; frame-src https://giscus.app; object-src 'none'; base-uri 'self'; form-action 'self';" always;
```

---

## 4. Chi tiết các chỉ thị Content Security Policy

| Chỉ thị       | Giá trị cho phép                                                         | Mục đích                                                                |
| ------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `default-src` | `'self'`                                                                 | Mặc định chỉ chấp nhận tài nguyên cùng origin                           |
| `script-src`  | `'self' 'unsafe-inline' https://giscus.app`                              | Cho phép script nội bộ, inline script xử lý theme và script Giscus      |
| `style-src`   | `'self' 'unsafe-inline' https://fonts.googleapis.com https://giscus.app` | Cho phép style Astro/Shiki, stylesheet Google Fonts và giao diện Giscus |
| `img-src`     | `'self' data: https:`                                                    | Cho phép ảnh nội bộ, SVG base64 và avatar từ GitHub / CDN               |
| `font-src`    | `'self' data: https://fonts.gstatic.com`                                 | Cho phép font self-hosted và webfont tải từ Google Fonts                |
| `connect-src` | `'self' https://giscus.app`                                              | Cho phép API call của Giscus bình luận                                  |
| `frame-src`   | `https://giscus.app`                                                     | Chỉ cho phép nhúng iframe bình luận từ Giscus                           |
| `object-src`  | `'none'`                                                                 | Vô hiệu hoá các plugin Flash/Java applet                                |
| `base-uri`    | `'self'`                                                                 | Ngăn chặn tấn công Base Tag Injection                                   |
| `form-action` | `'self'`                                                                 | Hạn chế gửi form ra ngoài domain                                        |

---

## 5. Hướng dẫn áp dụng và kiểm tra

1. Đăng nhập SSH vào server HestiaCP và cập nhật nội dung vào file:
   ```bash
   nano /home/[username]/conf/web/[your-domain.com]/nginx.conf_security
   ```
2. Include file trên vào `/home/[username]/conf/web/[your-domain.com]/nginx.hsts.conf`
   ```bash
   # add_header Strict-Transport-Security "max-age=31536000;" always;
   include /home/[username]/conf/web/[your-domain.com]/nginx.conf_security;
   ```
3. Kiểm tra cú pháp cấu hình Nginx:
   ```bash
   nginx -t
   ```
4. Khởi động lại hoặc reload Nginx:
   ```bash
   systemctl reload nginx
   ```
5. Kiểm tra headers thực tế bằng lệnh curl:
   ```bash
   curl -I https://[your-domain.com]
   ```
