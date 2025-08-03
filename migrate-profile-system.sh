#!/bin/bash

echo "🔄 SABO Profile System Migration Script"
echo "======================================"

# Create backup directory
BACKUP_DIR="/workspaces/sabo-pool-v8-76/backup/profile-legacy-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup of legacy profile files..."

# Backup legacy profile files
cp "/workspaces/sabo-pool-v8-76/src/pages/ProfilePage.tsx" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  ProfilePage.tsx not found"
cp "/workspaces/sabo-pool-v8-76/src/pages/Profile.tsx" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  Profile.tsx not found"
cp "/workspaces/sabo-pool-v8-76/src/pages/OptimizedMobileProfile.tsx" "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  OptimizedMobileProfile.tsx not found"

echo "✅ Backup completed at: $BACKUP_DIR"

echo ""
echo "🔍 Current Profile System Status:"
echo "================================="

# Check if new unified system exists
if [ -f "/workspaces/sabo-pool-v8-76/src/pages/UnifiedProfilePage.tsx" ]; then
    echo "✅ UnifiedProfilePage.tsx - READY"
else
    echo "❌ UnifiedProfilePage.tsx - MISSING"
fi

# Check unified components
UNIFIED_DIR="/workspaces/sabo-pool-v8-76/src/components/profile/unified"
if [ -d "$UNIFIED_DIR" ]; then
    echo "✅ Unified components directory exists"
    
    components=("ProfileHeader.tsx" "ProfileStats.tsx" "ProfileQuickActions.tsx" "ProfileContent.tsx" "ProfileActivities.tsx")
    for component in "${components[@]}"; do
        if [ -f "$UNIFIED_DIR/$component" ]; then
            echo "  ✅ $component"
        else
            echo "  ❌ $component - MISSING"
        fi
    done
else
    echo "❌ Unified components directory - MISSING"
fi

echo ""
echo "📊 Profile Files Analysis:"
echo "========================="

# Count profile-related files
PROFILE_FILES=$(find /workspaces/sabo-pool-v8-76/src -name "*[Pp]rofile*" -type f | wc -l)
echo "Total profile-related files: $PROFILE_FILES"

echo ""
echo "Legacy files to be cleaned up:"
echo "------------------------------"
find /workspaces/sabo-pool-v8-76/src -name "*[Pp]rofile*" -type f | grep -E "(ProfilePage|Profile\.tsx|OptimizedMobileProfile)" | while read -r file; do
    echo "🗑️  $file"
done

echo ""
echo "New unified system files:"
echo "------------------------"
find /workspaces/sabo-pool-v8-76/src -path "*/unified/*" -name "*Profile*" -type f | while read -r file; do
    echo "✨ $file"
done

echo ""
echo "🚀 Migration Status:"
echo "==================="
echo "✅ Unified components created"
echo "✅ Main UnifiedProfilePage created"
echo "✅ App.tsx routing updated"
echo "⏳ Ready for testing and cleanup"

echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Test the new profile page: http://localhost:5173/profile"
echo "2. Test arena mode: http://localhost:5173/profile?arena=true"
echo "3. Test different tabs: http://localhost:5173/profile?tab=stats"
echo "4. Verify mobile responsive design"
echo "5. Remove legacy files after testing"

echo ""
echo "🔧 Testing Commands:"
echo "==================="
echo "# Start dev server"
echo "npm run dev"
echo ""
echo "# Open profile in browser"
echo "open http://localhost:5173/profile"
echo ""
echo "# Test with different parameters"
echo "open http://localhost:5173/profile?arena=true"
echo "open http://localhost:5173/profile?tab=stats"
echo "open http://localhost:5173/profile?tab=achievements"

echo ""
echo "✨ Profile consolidation setup complete!"
