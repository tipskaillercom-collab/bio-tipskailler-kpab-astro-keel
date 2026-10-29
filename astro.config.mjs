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
const prefixEnv = 'APP_';
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'prefixEnv');
const {
  APP_ENV,
  APP_PRODUCTION_URL,
  APP_PRODUCTION_BASE,
  APP_DEVELOPMENT_URL,
  APP_DEVELOPMENT_BASE,
} = env;
const isProd = APP_ENV === 'production';
const APP_URL = isProd ? APP_PRODUCTION_URL : APP_DEVELOPMENT_URL;
const APP_BASE = isProd ? APP_PRODUCTION_BASE : APP_DEVELOPMENT_BASE;

const fileNameSecurityHeader = 'security-headers.json';
const filePathSecurityHeader = path.resolve(
  `.dev-resources/security/security-header/web-servers/docker/${fileNameSecurityHeader}`,
);

/** @type {Record<string, string>} */
let securityHeaders = {};

try {
  const content = fs.readFileSync(filePathSecurityHeader, 'utf-8');
  securityHeaders = JSON.parse(content);

  console.log(`Đã load thành công file \`${fileNameSecurityHeader}\`.`);
  // console.info('Nội dung file:', securityHeaders);
} catch (error) {
  console.error(`Không thể load file \`${fileNameSecurityHeader}\`.`);
}

// https://astro.build/config
export default defineConfig({
  // Change to your deployed URL. Used for sitemap, canonical, and RSS links.
  // For a GitHub Pages project site, `site` is the user/org domain and `base`
  // is the repository name. Drop `base` (or set it to '/') for a custom domain
  // or a `<user>.github.io` root site.
  // site: 'https://kpab.github.io',
  // base: '/astro-keel',
  site: APP_URL,
  base: APP_BASE,
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
        usePolling: true,
      },
    },
  },
  server: {
    headers: securityHeaders,
  },
});
