#!/bin/sh
# Pre-commit hook để kiểm tra translations

echo "🔍 Checking translations..."

# Chạy translation checker
npm run check-translations

if [ $? -ne 0 ]; then
  echo "❌ Translation check failed!"
  echo "Please add missing translations or use t() function for hardcoded strings"
  exit 1
fi

echo "✅ Translation check passed!"
