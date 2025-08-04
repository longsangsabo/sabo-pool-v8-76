#!/bin/bash

# 🛡️ Git Safety Check Script
# Chạy script này trước khi push để đảm bảo an toàn

echo "🔍 Git Safety Check - Kiểm tra an toàn trước khi push"
echo "=================================================="

# Kiểm tra branch hiện tại
current_branch=$(git branch --show-current)
echo "📍 Branch hiện tại: $current_branch"

if [ "$current_branch" = "main" ]; then
    echo "❌ CẢNH BÁO: Bạn đang ở branch main!"
    echo "   Hãy tạo feature branch trước khi làm việc:"
    echo "   git checkout -b feature/user-management-system"
    exit 1
fi

# Kiểm tra remote
echo "🌐 Remote repository:"
git remote -v

# Kiểm tra status
echo "📊 Git status:"
git status --short

# Kiểm tra staged files
staged_files=$(git diff --cached --name-only)
if [ -n "$staged_files" ]; then
    echo "📁 Files sẽ được commit:"
    echo "$staged_files"
    
    # Kiểm tra có file admin/clb không
    admin_clb_files=$(echo "$staged_files" | grep -E "(admin|clb|CLB)" || true)
    if [ -n "$admin_clb_files" ]; then
        echo "⚠️  CẢNH BÁO: Phát hiện files admin/clb trong staged:"
        echo "$admin_clb_files"
        echo "   Bạn có chắc muốn commit những file này không? (y/N)"
        read -r response
        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo "❌ Hủy bỏ. Hãy unstage files không liên quan:"
            echo "   git reset HEAD <file-name>"
            exit 1
        fi
    fi
else
    echo "📁 Không có files nào được staged"
fi

# Kiểm tra uncommitted changes
uncommitted=$(git diff --name-only)
if [ -n "$uncommitted" ]; then
    echo "📝 Files có thay đổi chưa commit:"
    echo "$uncommitted"
fi

# Kiểm tra sync với remote
echo "🔄 Kiểm tra sync với remote..."
git fetch origin

ahead=$(git rev-list --count HEAD..origin/$current_branch 2>/dev/null || echo "0")
behind=$(git rev-list --count origin/$current_branch..HEAD 2>/dev/null || echo "0")

if [ "$ahead" -gt 0 ]; then
    echo "⬇️  Branch local đang behind $ahead commits"
    echo "   Nên pull trước: git pull origin $current_branch"
fi

if [ "$behind" -gt 0 ]; then
    echo "⬆️  Branch local đang ahead $behind commits"
    echo "   Sẵn sàng push"
fi

echo ""
echo "✅ Lệnh push an toàn:"
echo "   git push -u origin $current_branch"
echo ""
echo "🚫 TUYỆT ĐỐI KHÔNG dùng:"
echo "   git push -f"
echo "   git push --force"
echo "   git push --force-with-lease"
echo ""
echo "� Nếu THỰC SỰ cần force push (Pull Request bị reject):"
echo "   ./emergency-force-push.sh  # Script với đầy đủ safeguards"
echo ""
echo "�📋 Sau khi push, tạo Pull Request tại:"
echo "   https://github.com/longsangsabo/sabo-pool-v8-76/pull/new/$current_branch"
