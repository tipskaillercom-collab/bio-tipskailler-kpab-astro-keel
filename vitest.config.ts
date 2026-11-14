/**
 * File: vitest.config.ts
 * Mô tả: Cấu hình Vitest chạy kiểm thử DOM bằng Happy-DOM nhẹ và tối ưu cho Dev Container.
 */

// import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

// export default defineConfig({
export default getViteConfig({
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
      // allowExec: true, // Cho phép bấm chạy/lưu file từ Vitest UI
      port: 4322,
      host: true, // Cho phép kết nối từ bên ngoài container,
    },
    // silent: false, // Đảm bảo Vitest không ẩn log console
    // Giữ nguyên các module gốc của Node.js (như node:fs, node:path) khi chạy vi.resetModules()
    server: {
      deps: {
        external: [/^node:/],
      },
    },
  },
});
