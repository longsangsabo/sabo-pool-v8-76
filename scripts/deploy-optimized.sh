#!/bin/bash

echo "🚀 Starting optimized deployment process..."

# Set memory limit for Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Clear previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/
rm -rf node_modules/.vite/

# Check dependencies
echo "📦 Checking dependencies..."
npm ci --prefer-offline --no-audit

# Pre-build optimization
echo "⚡ Pre-build optimization..."
# Update browserslist data to avoid warnings
npx update-browserslist-db@latest

# Build with progress tracking
echo "🏗️ Building application..."
npm run build:production

# Verify build
echo "✅ Verifying build..."
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

# Check bundle sizes
echo "📊 Bundle size analysis..."
du -sh dist/
ls -la dist/assets/ | sort -k5 -nr | head -10

# Get total size
TOTAL_SIZE=$(du -sm dist/ | cut -f1)
echo "📈 Total bundle size: ${TOTAL_SIZE}MB"

if [ $TOTAL_SIZE -gt 10 ]; then
  echo "⚠️  Warning: Bundle size is large (${TOTAL_SIZE}MB)"
  echo "This may cause deployment timeout issues"
fi

echo "🎉 Build completed successfully!"
echo "Ready for deployment to Lovable/Vercel"
