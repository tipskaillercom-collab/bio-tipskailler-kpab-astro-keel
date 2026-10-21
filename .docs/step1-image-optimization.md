# Bước 1: Tối ưu hóa Hình ảnh (Avatar/Banner) với `<Image/>` của Astro

Tài liệu này tổng hợp toàn bộ quy trình, tư duy kỹ thuật và kinh nghiệm thực chiến khi cấu hình tối ưu hóa hình ảnh trong dự án Astro nhằm đạt điểm 100/100 Lighthouse.

---

## 1. Nguyên lý hoạt động của Astro Assets Pipeline

Hiểu đúng cách Astro xử lý ảnh giúp bạn quản lý mã nguồn gọn gàng và tối ưu hiệu suất runtime:

- **Thư mục nguồn (`src/`):**
  - Đây là nơi bạn cất giữ **ảnh gốc** (chất lượng cao, dung lượng lớn như `.png`, `.jpg`).
  - Ảnh nên được đặt tập trung trong thư mục chuẩn `src/assets/` để Astro nhận diện và quản lý tự động.
- **Thư mục build (`dist/_astro/`):**
  - Khi bạn chạy lệnh build (`npm run build`), Astro sẽ tự động quét qua tất cả các component có sử dụng `<Image/>`.
  - Hệ thống sẽ tự động **nén, resize, chuyển đổi định dạng sang WebP hoặc AVIF** tùy theo hỗ trợ của trình duyệt người dùng, đồng thời sinh ra mã hash tên file để tối ưu caching.
  - Trong thư mục `src/` gốc, bạn sẽ không thấy các file ảnh tối ưu này xuất hiện; toàn bộ thành quả tối ưu sẽ nằm gọn trong thư mục `dist/_astro/`.

---

## 2. Quy chuẩn kỹ thuật khi sử dụng `<Image/>`

Để đạt hiệu quả tối ưu điểm Lighthouse (đặc biệt là chỉ số LCP - Largest Contentful Paint):

- **Import component:** Luôn khai báo import từ thư viện chính thức của Astro:
  ```astro
  import {Image} from 'astro:assets'; import myAvatar from '../assets/avatar.png'; // Trỏ trực tiếp
  đến ảnh gốc
  ```
- **Thuộc tính bắt buộc:** Phải cung cấp đầy đủ `width` và `height` để tránh tình trạng layout shift (CLS).
- **Thuộc tính `loading` chiến lược:**
  - **`loading="eager"`:** Sử dụng cho các ảnh nằm ở màn hình đầu tiên (Above-the-fold) như Avatar chính hoặc Banner đầu trang. Điều này ra lệnh cho trình duyệt ưu tiên tải ngay lập tức.
  - **`loading="lazy"`:** Sử dụng cho các ảnh nằm phía dưới (Below-the-fold), giúp tiết kiệm băng thông và tăng tốc độ tải trang ban đầu.
- **Thuộc tính `quality` (tùy chọn):** Có thể tinh chỉnh mức độ nén (ví dụ: `quality={80}`) để cân bằng giữa chất lượng hiển thị và dung lượng file.

---

## 3. Ví dụ code thực tế (So sánh Trước và Sau)

### Trước khi tối ưu (Sử dụng thẻ `<img>` thô):

```html
<img src="/images/avatar.png" alt="Avatar cá nhân" width="120" height="120" />
```

_Nhược điểm:_ Trình duyệt tải thẳng file PNG gốc nặng, không tự động chuyển sang WebP/AVIF, dễ làm giảm điểm hiệu năng trên mobile.

### Sau khi tối ưu (Sử dụng `<Image/>` của Astro):

```astro
---
import { Image } from 'astro:assets';
import avatarImage from '../assets/avatar.png';
---

<Image
  src={avatarImage}
  alt="Avatar cá nhân"
  width={120}
  height={120}
  loading="eager"
  quality={80}
/>
```

_Ưu điểm:_ Astro tự động sinh ra các định dạng hiện đại, resize đúng kích thước hiển thị thực tế và tối ưu hóa LCP cho Lighthouse.

---

## 4. Kinh nghiệm thực chiến & Lưu ý khi Dev với AI (Aider)

- **Vị trí đặt file:** Đặt toàn bộ ảnh gốc vào `src/assets/`. Tránh để ảnh quá lớn (vài chục MB) trong repo, hãy chuẩn bị ảnh gốc ở mức độ vừa phải (ví dụ 2x kích thước hiển thị thật).
- **Xử lý sự cố API / AI Quá tải:** Khi làm việc qua môi trường dev container với Aider, nếu gặp lỗi `503 Service Unavailable` từ nhà cung cấp mô hình (như lỗi quá tải tạm thời từ Vertex AI/Gemini), bạn hãy:
  1. Nhấn `Ctrl + C` để dừng vòng lặp retry đang bị kẹt của Aider.
  2. Chuyển sang model ổn định hơn hoặc tự tay áp dụng đoạn code thay thế `<Image/>` đã được chuẩn hóa ở mục 3.
