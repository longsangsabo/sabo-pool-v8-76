import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Remove base path to fix routing issues
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    mode === 'analyze' && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Admin code splitting - separate chunk for admin pages only
          if (id.includes('/pages/admin/') || id.includes('/components/admin/')) {
            return 'admin';
          }
          
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Routing
          if (id.includes('react-router-dom')) {
            return 'router';
          }
          
          // UI Components (consolidated from 3 chunks to 1)
          if (id.includes('@radix-ui/') || id.includes('react-hook-form')) {
            return 'ui-components';
          }
          
          // Data & State Management
          if (id.includes('@tanstack/react-query') || id.includes('@supabase/supabase-js')) {
            return 'data';
          }
          
          // Extensions (consolidated charts, performance, misc)
          if (id.includes('recharts') || id.includes('d3') || id.includes('react-window') || 
              id.includes('framer-motion') || id.includes('react-helmet-async') ||
              id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'extensions';
          }
        },
        // Ensure proper chunk naming and avoid conflicts
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable build optimizations
    target: 'esnext',
    minify: 'esbuild',
    // Split CSS
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
