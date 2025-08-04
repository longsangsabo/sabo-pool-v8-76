#!/bin/bash

# 🧹 CLEANUP SCRIPT - PHASE 1: SAFE CLEANUP
# Remove deprecated and archived files that are no longer used

echo "🧹 Starting cleanup of deprecated and archived files..."

# Create backup directory
backup_dir="./cleanup-backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$backup_dir"

echo "📦 Creating backup in: $backup_dir"

# List of deprecated files to remove
deprecated_files=(
    "src/pages/_DEPRECATED_OptimizedTournamentsPage.tsx"
    "src/pages/_DEPRECATED_DashboardOverview.tsx"
    "src/pages/_DEPRECATED_ResetPasswordPage.tsx"
    "src/pages/_DEPRECATED_Dashboard.tsx"
    "src/pages/_DEPRECATED_ForgotPasswordPage.tsx"
    "src/pages/_DEPRECATED_SocialFeedPage.tsx"
    "src/pages/_DEPRECATED_LoginPage.tsx"
)

# List of archived files to remove
archived_files=(
    "src/pages/_ARCHIVED_DashboardOverview.tsx"
    "src/pages/_ARCHIVED_ChallengesPage.tsx"
    "src/pages/_ARCHIVED_Dashboard.tsx"
    "src/pages/_ARCHIVED_EnhancedChallengesPage.tsx"
)

# Function to backup and remove files
cleanup_files() {
    local files=("$@")
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            echo "🗂️  Backing up: $file"
            cp "$file" "$backup_dir/$(basename "$file")"
            echo "🗑️  Removing: $file"
            rm "$file"
        else
            echo "⚠️  File not found: $file"
        fi
    done
}

echo ""
echo "🗑️  Phase 1: Removing DEPRECATED files..."
cleanup_files "${deprecated_files[@]}"

echo ""
echo "🗑️  Phase 2: Removing ARCHIVED files..."
cleanup_files "${archived_files[@]}"

echo ""
echo "✅ Cleanup completed!"
echo "📦 Backup created in: $backup_dir"
echo ""
echo "📊 Summary:"
echo "   - Deprecated files: ${#deprecated_files[@]}"
echo "   - Archived files: ${#archived_files[@]}"
echo "   - Total cleaned: $((${#deprecated_files[@]} + ${#archived_files[@]}))"
echo ""
echo "⚠️  Note: This only removes deprecated/archived files."
echo "   Core functionality files (TournamentsPage, EnhancedChallengesPageV2) are preserved."
echo ""
echo "🔍 Next steps:"
echo "   1. Test the application to ensure no broken imports"
echo "   2. Run 'npm run build' to verify TypeScript compilation"
echo "   3. Review the hub migration progress in NEW_VS_OLD_PAGES_ANALYSIS.md"
