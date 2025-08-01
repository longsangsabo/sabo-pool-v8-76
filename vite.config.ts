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
    // ✅ PHASE 4: Build performance optimization
    target: 'esnext',
    minify: 'esbuild', // Faster than terser
    cssCodeSplit: true,
    sourcemap: false, // Disable sourcemaps for faster build
    chunkSizeWarningLimit: 500, // Reduce warning limit to catch large chunks
    
    // ✅ Advanced Rollup optimizations
    rollupOptions: {
      // Increase parallel operations for faster builds
      maxParallelFileOps: 16, // Increased from 12
      
      // ✅ PHASE 4: Advanced build optimizations
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
      
      // ✅ External dependencies to reduce bundle size
      external: (id) => {
        // Don't externalize core dependencies
        if (id.includes('react') || id.includes('@supabase') || id.includes('@tanstack')) {
          return false;
        }
        // Externalize heavy optional dependencies
        return id.includes('date-fns/locale') && !id.includes('date-fns/locale/vi');
      },
      
      // Output configuration for optimal chunking
      output: {
        // ✅ PHASE 6: Caching strategy - Stable chunk names
        chunkFileNames: (chunkInfo) => {
          // Vendor chunks - Long cache (1 year)
          if (chunkInfo.name.includes('vendor')) {
            return 'assets/vendor/[name]-[hash].js';
          }
          // Admin chunks - Medium cache (1 month)  
          if (chunkInfo.name.includes('admin')) {
            return 'assets/admin/[name]-[hash].js';
          }
          // App chunks - Short cache (1 week)
          return 'assets/app/[name]-[hash].js';
        },
        
        assetFileNames: (assetInfo) => {
          // CSS files
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash].css';
          }
          // Images
          if (/\.(png|jpe?g|webp|svg|gif)$/.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          // Other assets
          return 'assets/[name]-[hash][extname]';
        },
        // ✅ OPTIMAL: Let Vite handle chunking automatically
        // Vite's automatic chunking is often better than manual
        manualChunks: undefined,
      },
    },
  },
  // ✅ PHASE 1: Advanced dependency optimization
  optimizeDeps: {
    // Pre-bundle critical dependencies for faster builds
    include: [
      // CORE - Load đầu tiên (Highest priority)
      'react',
      'react-dom',
      'react-router-dom',
      
      // AUTH & DATA - Critical for app functionality
      '@supabase/supabase-js',
      '@supabase/auth-js',
      '@tanstack/react-query',
      
      // UI ESSENTIALS - Frequently used
      'lucide-react',
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      
      // UTILITIES - Small but frequently used
      'sonner',
      'next-themes',
      'react-helmet-async',
    ],
    
    // EXCLUDE heavy dependencies for lazy loading
    exclude: [
      'framer-motion', // 76KB - Load only when needed
      'recharts', // Heavy charts - Load on demand  
      'date-fns/locale', // Locale files - Load specific locale only
      '@radix-ui/react-calendar', // Large component - Lazy load
      '@radix-ui/react-tooltip', // Non-critical - Lazy load
    ],
    
    // Force dependency re-optimization
    force: false,
    
    // Entry points for better chunking
    entries: [
      'src/main.tsx',
      'src/pages/**/index.tsx'
    ],
  },
  // ✅ PHASE 4: Advanced esbuild optimization
  esbuild: {
    target: 'esnext',
    platform: 'browser',
    format: 'esm',
    
    // Production optimizations
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    
    // Faster builds
    keepNames: false,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    
    // Tree shaking
    treeShaking: true,
    
    // Source maps only in development
    sourcemap: mode === 'development',
  },
}));
