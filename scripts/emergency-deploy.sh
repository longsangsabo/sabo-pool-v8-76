#!/bin/bash
# Emergency deployment script

echo "🚨 Emergency deployment - Ultra lightweight build"

# Use fastest build settings
export NODE_OPTIONS="--max-old-space-size=2048"

# Skip non-essential optimizations
npm run build:fast

# Check if build succeeded
if [ -d "dist" ]; then
  echo "✅ Emergency build completed"
  echo "📦 Bundle size: $(du -sh dist/)"
  
  # Deploy immediately
  echo "🚀 Ready for emergency deployment"
else
  echo "❌ Emergency build failed"
  exit 1
fi
