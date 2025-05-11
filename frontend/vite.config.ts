import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'tool.super-i.cn' // 添加您的域名到允许列表
      // 可以添加其他需要允许的域名
    ],
    proxy: {
      '/api': {
        target: 'http://47.94.59.198:5000',
        changeOrigin: true,
      },
      // 新增 /uploads 代理
      '/uploads': {
        target: 'http://47.94.59.198:5000',
        changeOrigin: true,
      }
    },
  },
}); 