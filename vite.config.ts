import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  const analyze = process.env.ANALYZE === '1';

  return {
    plugins: [
      react(),
      tailwindcss(),
      analyze
        ? visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
            open: false,
          })
        : undefined,
    ].filter(Boolean),
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return;
            if (id.includes('hanzi-writer')) return 'hanzi-writer';
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'react-vendor';
            }
          },
        },
      },
      cssCodeSplit: true,
    },
    optimizeDeps: {
      include: ['hanzi-writer', 'zustand'],
    },
  };
});
