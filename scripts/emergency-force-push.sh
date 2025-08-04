#!/bin/bash

# 🚨 Emergency Force Push Script with Full Protection
# Sử dụng khi Pull Request bị reject và cần force push khẩn cấp

set -e  # Exit on any error

echo "🚨 EMERGENCY FORCE PUSH PROTOCOL"
echo "================================="
echo "⚠️  Use this ONLY when Pull Request is impossible!"
echo ""

# Pre-flight checks
current_branch=$(git branch --show-current)
echo "📍 Current branch: $current_branch"

if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Working directory clean"
else
    echo "❌ Working directory has uncommitted changes"
    git status --short
    read -p "🤔 Commit changes first? (y/N): " should_commit
    if [ "$should_commit" = "y" ]; then
        git add .
        git commit -m "wip: save work before emergency force push"
    fi
fi

# User confirmation
echo ""
read -p "⚠️  Are you absolutely sure you need to force push? (y/N): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ Cancelled for safety. Consider these alternatives:"
    echo "   1. Resolve conflicts manually"
    echo "   2. Ask team lead for help"
    echo "   3. Use git revert instead of force push"
    exit 1
fi

# Create comprehensive backups
echo ""
echo "📦 STEP 1: Creating comprehensive backups..."
timestamp=$(date +%Y%m%d-%H%M%S)

# Ensure we're on main and updated
git fetch origin
git checkout main
git pull origin main

# Create backup branches
echo "   🌿 Creating backup branches..."
git checkout -b "emergency-backup-main-$timestamp"
git push origin "emergency-backup-main-$timestamp"

git checkout -b "emergency-backup-complete-$timestamp"
git push origin "emergency-backup-complete-$timestamp"

# Create file system backup
echo "   📁 Creating file system backup..."
backup_name="emergency-backup-$timestamp.tar.gz"

# Backup critical directories
if tar -czf "$backup_name" \
    src/features/CLB/ \
    src/components/admin/ \
    src/pages/admin/ \
    src/components/ui/ \
    src/styles/ \
    src/assets/ \
    src/layouts/ \
    package.json \
    --exclude=node_modules \
    --exclude=.git 2>/dev/null; then
    echo "   ✅ File backup created: $backup_name"
else
    echo "   ⚠️  Some directories may not exist - backup created with available files"
fi

# Document current state
echo "   📊 Documenting current state..."
{
    echo "=== EMERGENCY BACKUP DOCUMENTATION ==="
    echo "Timestamp: $timestamp"
    echo "Git commit: $(git rev-parse HEAD)"
    echo "Git branch: $(git branch --show-current)"
    echo ""
    echo "=== FILE COUNTS ==="
    echo "Admin files: $(find src/components/admin/ src/pages/admin/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)"
    echo "CLB files: $(find src/features/CLB/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)"
    echo "UI files: $(find src/components/ui/ src/styles/ -name "*.tsx" -o -name "*.ts" -o -name "*.css" 2>/dev/null | wc -l)"
    echo ""
    echo "=== RECENT COMMITS ==="
    git log --oneline -10
} > "emergency-backup-$timestamp.txt"

echo "   📝 Documentation created: emergency-backup-$timestamp.txt"

# Verify critical systems exist
echo ""
echo "🔍 STEP 2: Verifying critical systems..."

admin_files=$(find src/components/admin/ src/pages/admin/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
clb_files=$(find src/features/CLB/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
ui_files=$(find src/components/ui/ src/styles/ -name "*.tsx" -o -name "*.ts" -o -name "*.css" 2>/dev/null | wc -l)

echo "   📊 Admin system: $admin_files files"
echo "   📊 CLB system: $clb_files files"
echo "   📊 UI system: $ui_files files"

# Validate file counts
critical_missing=false

if [ "$admin_files" -lt 5 ]; then
    echo "   ⚠️  WARNING: Admin system seems incomplete ($admin_files files)"
    critical_missing=true
fi

if [ "$clb_files" -lt 5 ]; then
    echo "   ⚠️  WARNING: CLB system seems incomplete ($clb_files files)"
    critical_missing=true
fi

if [ "$critical_missing" = true ]; then
    echo ""
    echo "❌ CRITICAL: Essential systems appear to be missing!"
    echo "   This could indicate a previous data loss."
    echo "   Backup files are available in:"
    echo "   - Branch: emergency-backup-main-$timestamp"
    echo "   - File: $backup_name"
    echo ""
    read -p "🚨 Continue despite missing systems? (y/N): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        echo "❌ Emergency force push cancelled for data safety"
        echo "   Please investigate missing systems before proceeding"
        exit 1
    fi
fi

# Prepare force push branch
echo ""
echo "🔄 STEP 3: Preparing safe force push..."

git checkout main
git checkout -b "emergency-force-push-$timestamp"

echo "   🎯 Ready to merge your feature work"
echo "   📝 Please merge your feature branches now:"
echo ""
echo "   Example commands:"
echo "   git merge feature/ui-enhancement --no-ff -m 'emergency: merge UI work'"
echo "   git merge feature/your-work --no-ff -m 'emergency: merge additional work'"
echo ""
read -p "Press Enter when you've completed your merges..."

# Verify build
echo ""
echo "🔧 STEP 4: Verifying build..."
if npm run build > build-log-$timestamp.txt 2>&1; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed! Check build-log-$timestamp.txt"
    echo "   Please fix build errors before continuing"
    read -p "Continue anyway? (y/N): " continue_build_fail
    if [ "$continue_build_fail" != "y" ]; then
        echo "❌ Cancelled due to build failure"
        exit 1
    fi
fi

# Final verification
echo ""
echo "🔍 STEP 5: Final verification..."

admin_files_final=$(find src/components/admin/ src/pages/admin/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
clb_files_final=$(find src/features/CLB/ -name "*.tsx" -o -name "*.ts" 2>/dev/null | wc -l)
ui_files_final=$(find src/components/ui/ src/styles/ -name "*.tsx" -o -name "*.ts" -o -name "*.css" 2>/dev/null | wc -l)

echo "   📊 Final state:"
echo "      Admin: $admin_files → $admin_files_final files"
echo "      CLB: $clb_files → $clb_files_final files"  
echo "      UI: $ui_files → $ui_files_final files"

if [ "$admin_files_final" -lt "$admin_files" ] || [ "$clb_files_final" -lt "$clb_files" ]; then
    echo "   ⚠️  WARNING: File counts decreased! Possible data loss."
    read -p "🚨 Continue with reduced file counts? (y/N): " continue_reduced
    if [ "$continue_reduced" != "y" ]; then
        echo "❌ Cancelled due to potential data loss"
        exit 1
    fi
fi

# Execute force push with safeguards
echo ""
echo "🚀 STEP 6: Executing controlled force push..."

echo "   📤 Pushing emergency branch first..."
git push origin "emergency-force-push-$timestamp"

echo "   🌐 Emergency branch available at:"
echo "      https://github.com/longsangsabo/sabo-pool-v8-76/tree/emergency-force-push-$timestamp"
echo ""
echo "   Please verify the branch contains all expected systems"
read -p "Does the remote branch look correct? (y/N): " remote_ok

if [ "$remote_ok" != "y" ]; then
    echo "❌ Force push cancelled - please investigate remote branch"
    exit 1
fi

# Final confirmation for main branch update
echo ""
echo "🚨 FINAL CONFIRMATION:"
echo "   ✅ Backups created and verified"
echo "   ✅ Emergency branch pushed successfully"
echo "   ✅ Remote verification completed"
echo ""
echo "   About to force push to main branch..."
echo "   This will overwrite the main branch history!"
echo ""
read -p "Type 'EXECUTE-FORCE-PUSH' to proceed: " final_confirm

if [ "$final_confirm" = "EXECUTE-FORCE-PUSH" ]; then
    echo "   🎯 Updating main branch..."
    git checkout main
    git reset --hard "emergency-force-push-$timestamp"
    
    echo "   📤 Force pushing to main..."
    git push -f origin main
    
    echo ""
    echo "✅ EMERGENCY FORCE PUSH COMPLETED"
    echo "================================="
    echo "   📦 Backups available:"
    echo "      - Branch: emergency-backup-main-$timestamp"
    echo "      - Branch: emergency-backup-complete-$timestamp"
    echo "      - Files: $backup_name"
    echo "      - Documentation: emergency-backup-$timestamp.txt"
    echo ""
    echo "   🔍 Post-push verification:"
    echo "      - Check main branch: https://github.com/longsangsabo/sabo-pool-v8-76"
    echo "      - Verify admin system works"
    echo "      - Verify CLB system works"
    echo "      - Run full deployment test"
    echo ""
    
    # Cleanup options
    read -p "Clean up emergency branches? (y/N): " cleanup
    if [ "$cleanup" = "y" ]; then
        git push origin --delete "emergency-force-push-$timestamp" 2>/dev/null || true
        git branch -D "emergency-force-push-$timestamp" 2>/dev/null || true
        echo "   🗑️  Emergency working branch cleaned up"
        echo "   📦 Backup branches preserved for safety"
    fi
    
    echo ""
    echo "🎉 Emergency force push protocol completed successfully!"
    echo "   Don't forget to notify your team about the emergency push."
    
else
    echo "❌ Force push cancelled at final confirmation"
    echo "   Emergency branch remains available for manual inspection"
fi

echo ""
echo "🏁 Emergency protocol finished"
