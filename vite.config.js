import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // در حالت dev درخواست‌های API به سرور محلی (پورت 4000) فرستاده می‌شن
    proxy: {
      '/api': 'http://localhost:4000',
      '/sitemap.xml': 'http://localhost:4000',
    },
  },
});
