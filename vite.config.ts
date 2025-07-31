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
          // Admin code splitting - separate chunk for admin
          if (id.includes('/admin/') || id.includes('AdminRouter') || id.includes('AdminProvider')) {
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
          
          // UI Components (split by usage frequency)
          if (id.includes('@radix-ui/react-dialog') || 
              id.includes('@radix-ui/react-dropdown-menu') || 
              id.includes('@radix-ui/react-slot')) {
            return 'ui-core';
          }
          
          if (id.includes('@radix-ui/react-select') || 
              id.includes('@radix-ui/react-checkbox') || 
              id.includes('react-hook-form')) {
            return 'ui-forms';
          }
          
          if (id.includes('@radix-ui/react-tabs') || 
              id.includes('@radix-ui/react-accordion') || 
              id.includes('@radix-ui/react-navigation-menu')) {
            return 'ui-advanced';
          }
          
          // Data & State Management
          if (id.includes('@tanstack/react-query') || id.includes('@supabase/supabase-js')) {
            return 'data';
          }
          
          // Utilities
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          
          // Charts & Visualization
          if (id.includes('recharts') || id.includes('d3')) {
            return 'charts';
          }
          
          // Performance & Virtualization
          if (id.includes('react-window')) {
            return 'performance';
          }
          
          // Less frequently used libraries
          if (id.includes('framer-motion') || id.includes('react-helmet-async')) {
            return 'misc';
          }
        },
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
