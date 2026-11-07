/**
 * File: vitest.config.ts
 * Mô tả: Cấu hình Vitest chạy kiểm thử DOM bằng Happy-DOM nhẹ và tối ưu cho Dev Container.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Sử dụng môi trường happy-dom để giả lập Browser APIs (localStorage, document, window)
    environment: 'happy-dom',
    // Tìm các file kiểm thử .test.ts hoặc .spec.ts
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    // Bật chế độ globals nếu cần
    globals: true,
    // Cấu hình giao diện Vitest UI
    ui: true,
    api: {
      port: 4322,
      host: true, // Cho phép kết nối từ bên ngoài container,
    },
  },
});
