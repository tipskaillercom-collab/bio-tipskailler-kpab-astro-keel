# Security Audit & CSP (Content Security Policy) Report

- **Ngày kiểm tra:** 2026-10-21
- **Tên miền mục tiêu:** `bio.tipskailler.com`
- **Môi trường triển khai:** HestiaCP (Nginx Server-level) + Astro SSG

---

## 1. Cấu hình HTTP Security Headers tại Nginx
Cấu hình này được đặt tại file tùy chỉnh của Nginx trên HestiaCP (đảm bảo không bị mất khi rebuild domain):
- **Đường dẫn file:** `/home/tips_dev/conf/web/bio.tipskailler.com/nginx.conf_security`

```nginx
# Security Headers cho bio.tipskailler.com
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), fullscreen=(self)" always;

# Content Security Policy (Bao gồm hỗ trợ Astro SSG và Giscus Comments)
add_header Content-Security-Policy "
    default-src 'self'; 
    script-src 'self' 'unsafe-inline' [https://giscus.app](https://giscus.app); 
    style-src 'self' 'unsafe-inline' [https://fonts.googleapis.com](https://fonts.googleapis.com) [https://giscus.app](https://giscus.app); 
    img-src 'self' data: https:; 
    font-src 'self' data: [https://fonts.gstatic.com](https://fonts.gstatic.com); 
    connect-src 'self' [https://giscus.app](https://giscus.app); 
    frame-src [https://giscus.app](https://giscus.app);
" always;
