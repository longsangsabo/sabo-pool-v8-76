#!/bin/bash

# SAFE PROJECT REORGANIZATION - IMPORT PATH UPDATES
# This script updates all import paths to match the new structure

echo "=== UPDATING IMPORT PATHS AFTER REORGANIZATION ==="

# Function to process a specific pattern
update_pattern() {
    local pattern="$1"
    local replacement="$2"
    echo "  Processing pattern: $pattern -> $replacement"
    find src/ -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) -exec sed -i "s|$pattern|$replacement|g" {} +
}

echo "1. Updating relative path imports to absolute..."
# Convert ../../../ patterns to absolute imports
update_pattern "from ['\"]\.\.\/\.\.\/\.\.\/components" "from '@/components"
update_pattern "from ['\"]\.\.\/\.\.\/components" "from '@/components"
update_pattern "from ['\"]\.\.\/\.\.\/\.\.\/hooks" "from '@/hooks"
update_pattern "from ['\"]\.\.\/\.\.\/hooks" "from '@/hooks"
update_pattern "from ['\"]\.\.\/\.\.\/\.\.\/utils" "from '@/utils"
update_pattern "from ['\"]\.\.\/\.\.\/utils" "from '@/utils"

echo "2. Updating feature-based imports..."
# Admin feature
update_pattern "@/pages/admin/" "@/features/admin/pages/"
update_pattern "@/components/admin/" "@/features/admin/components/"
update_pattern "\.\.\/\.\.\/\.\.\/components/admin/" "@/features/admin/components/"

# Club feature
update_pattern "@/features/CLB/" "@/features/club/"
update_pattern "@/components/club/" "@/features/club/components/"
update_pattern "\.\.\/\.\.\/\.\.\/components/club/" "@/features/club/components/"

# User feature
update_pattern "@/pages/user/" "@/features/user/pages/"
update_pattern "@/components/user/" "@/features/user/components/"
update_pattern "\.\.\/\.\.\/\.\.\/components/user/" "@/features/user/components/"

# Tournament feature
update_pattern "@/components/tournament/" "@/features/tournament/components/"
update_pattern "\.\.\/\.\.\/\.\.\/components/tournament/" "@/features/tournament/components/"

echo "3. Updating shared components..."
# Shared components
update_pattern "@/components/shared/" "@/shared/components/"
update_pattern "\.\.\/\.\.\/\.\.\/components/shared/" "@/shared/components/"
update_pattern "@/components/ui/" "@/shared/components/ui/"
update_pattern "from ['\"]\.\.\/\.\.\/ui/" "from '@/shared/components/ui/"

echo "4. Updating feature-specific imports..."
# Feature-specific imports
update_pattern "from ['\"]\.\.\/\.\.\/contexts/" "from '@/features/club/contexts/"
update_pattern "from ['\"]\.\.\/\.\.\/types/" "from '@/features/club/types/"
update_pattern "from ['\"]\.\.\/\.\.DisabledAdminComponent" "from '@/features/admin/components/DisabledAdminComponent"

# Phase 4: Update UI component imports
echo "4. Updating UI component imports..."
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/components/ui/|@/shared/components/ui/|g'

# Phase 5: Update auth imports
echo "5. Updating auth imports..."
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/components/auth/|@/core/auth/|g'

# Phase 6: Update config imports
echo "6. Updating config imports..."
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/config/|@/core/config/|g'

echo "✅ Import path updates completed!"

# Verification phase
echo "=== VERIFICATION ==="
echo "Checking for remaining old import paths..."

echo "Old admin imports:"
grep -r "@/pages/admin/" src/ --include="*.tsx" --include="*.ts" | wc -l

echo "Old CLB imports:"  
grep -r "@/features/CLB/" src/ --include="*.tsx" --include="*.ts" | wc -l

echo "Old user imports:"
grep -r "@/pages/user/" src/ --include="*.tsx" --include="*.ts" | wc -l

echo "Old UI imports:"
grep -r "@/components/ui/" src/ --include="*.tsx" --include="*.ts" | wc -l

echo "Old auth imports:"
grep -r "@/components/auth/" src/ --include="*.tsx" --include="*.ts" | wc -l

echo "=== REORGANIZATION COMPLETE ==="
