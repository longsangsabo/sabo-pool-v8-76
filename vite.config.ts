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
    // ✅ Performance optimizations
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps for faster build
    rollupOptions: {
      // ✅ Optimize bundle size with better chunking
      output: {
        manualChunks: (id) => {
          // Vendor libraries - most stable, cache-friendly
          if (id.includes('node_modules')) {
            // Core React - highest priority
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            
            // Router - high priority
            if (id.includes('react-router-dom')) {
              return 'router-vendor';
            }
            
            // Data layer - medium priority  
            if (id.includes('@tanstack/react-query') || 
                id.includes('@supabase/supabase-js') ||
                id.includes('@supabase/auth-js')) {
              return 'data-vendor';
            }
            
            // UI libraries - split by size
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            
            // Utilities - low priority
            if (id.includes('date-fns') || 
                id.includes('clsx') || 
                id.includes('tailwind-merge') ||
                id.includes('class-variance-authority')) {
              return 'utils-vendor';
            }
            
            // Animation/Heavy libs - lowest priority
            if (id.includes('framer-motion') || 
                id.includes('recharts') ||
                id.includes('react-helmet-async')) {
              return 'heavy-vendor';
            }
            
            // Everything else
            return 'vendor';
          }
          
          // App code chunking
          if (id.includes('/admin/') || 
              id.includes('AdminRouter') || 
              id.includes('AdminProvider')) {
            return 'admin';
          }
          
          if (id.includes('/tournament/') || 
              id.includes('Tournament') ||
              id.includes('bracket')) {
            return 'tournaments';
          }
          
          if (id.includes('/challenge/') || 
              id.includes('Challenge') ||
              id.includes('/pages/EnhancedChallengesPageV2')) {
            return 'challenges';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // ✅ Faster dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ],
    // Force pre-bundling of heavy dependencies
    force: false,
  },
  // ✅ Enable parallel processing
  esbuild: {
    target: 'esnext',
    // Drop console/debugger in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
