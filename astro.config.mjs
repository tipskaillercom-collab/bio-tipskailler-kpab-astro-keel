// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './remark-reading-time.mjs';
import { loadEnv } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Nạp các biến từ file .env vào môi trường
const {
  PUBLIC_APP_ENV,
  PUBLIC_APP_PRODUCTION_URL,
  PUBLIC_APP_PRODUCTION_BASE,
  PUBLIC_APP_LOCAL_URL,
  PUBLIC_APP_LOCAL_BASE,
} = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'PUBLIC_');

const isProd = PUBLIC_APP_ENV === 'production';

// Đọc và parse file cấu hình headers tự động
const headersFilePath = path.resolve('./security-headers.json');
let securityHeaders = {}; // Hoặc bạn có thể dùng: /** @type {import('node:http').OutgoingHttpHeaders} */ ({});

try {
  const fileContent = fs.readFileSync(headersFilePath, 'utf-8');
  securityHeaders = JSON.parse(fileContent);
} catch (error) {
  console.warn('Không tìm thấy file security-headers.json, bỏ qua headers local dev.');
}

// https://astro.build/config
export default defineConfig({
  // Change to your deployed URL. Used for sitemap, canonical, and RSS links.
  // For a GitHub Pages project site, `site` is the user/org domain and `base`
  // is the repository name. Drop `base` (or set it to '/') for a custom domain
  // or a `<user>.github.io` root site.
  // site: 'https://kpab.github.io',
  // base: '/astro-keel',
  site: isProd ? PUBLIC_APP_PRODUCTION_URL : PUBLIC_APP_LOCAL_URL,
  base: isProd ? PUBLIC_APP_PRODUCTION_BASE : PUBLIC_APP_LOCAL_BASE,
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime],
    }),
    // Dual Shiki themes; `defaultColor: false` emits CSS variables
    // (--shiki-light / --shiki-dark) so global.css can switch with the theme.
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      wrap: true,
    },
  },
  vite: {
    server: {
      watch: {
        usePolling: true, // Ép Vite dùng phương pháp polling để bắt file thay đổi trong Docker
      },
    },
  },
  server: {
    headers: /** @type {import('node:http').OutgoingHttpHeaders} */ (securityHeaders)
  }
});
