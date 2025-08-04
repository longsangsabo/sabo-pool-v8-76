#!/bin/bash

# 🛡️ USER BACKUP SCRIPT - An toàn tuyệt đối cho User Feature
# Tác giả: GitHub Copilot
# Mục đích: Backup user work trước khi pull foundation updates

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
USER_PATH="src/features/user"
BACKUP_DIR="../user_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="user_cleanup_${TIMESTAMP}"

echo -e "${BLUE}🛡️ USER FEATURE BACKUP TOOL${NC}"
echo -e "${BLUE}================================${NC}"

# Check if user folder exists
if [ ! -d "$USER_PATH" ]; then
    echo -e "${RED}❌ Error: User folder not found at $USER_PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Found user folder: $USER_PATH${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# 1. Git Status Check
echo -e "${BLUE}🔍 Checking git status...${NC}"
git status --short "$USER_PATH"

# 2. Count files and lines
echo -e "${BLUE}📊 Analyzing user feature...${NC}"
FILE_COUNT=$(find "$USER_PATH" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | wc -l)
TOTAL_LINES=$(find "$USER_PATH" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")

echo -e "${GREEN}  Files: $FILE_COUNT${NC}"
echo -e "${GREEN}  Lines: $TOTAL_LINES${NC}"

# 3. Create comprehensive backup
echo -e "${BLUE}💾 Creating backup...${NC}"

# Physical backup
PHYSICAL_BACKUP="$BACKUP_DIR/physical_$BACKUP_NAME"
cp -r "$USER_PATH" "$PHYSICAL_BACKUP"
echo -e "${GREEN}  ✅ Physical backup: $PHYSICAL_BACKUP${NC}"

# Git stash backup (if git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${BLUE}🔄 Creating git stash backup...${NC}"
    git add "$USER_PATH" 2>/dev/null || true
    STASH_MESSAGE="USER_BACKUP_$TIMESTAMP"
    git stash push -m "$STASH_MESSAGE" "$USER_PATH" 2>/dev/null || echo -e "${YELLOW}  ⚠️ No changes to stash${NC}"
    echo -e "${GREEN}  ✅ Git stash: $STASH_MESSAGE${NC}"
fi

# Create backup manifest
MANIFEST_FILE="$BACKUP_DIR/manifest_$BACKUP_NAME.txt"
cat > "$MANIFEST_FILE" << EOF
# USER FEATURE BACKUP MANIFEST
Backup Created: $(date)
Original Path: $USER_PATH
Physical Backup: $PHYSICAL_BACKUP
Git Stash Message: $STASH_MESSAGE

# File Structure:
$(find "$USER_PATH" -type f | sort)

# File Statistics:
Total Files: $FILE_COUNT
Total Lines: $TOTAL_LINES

# Git Status at Backup:
$(git status --short "$USER_PATH" 2>/dev/null || echo "Not in git repository")

# Recent Git Commits affecting user:
$(git log --oneline -10 --pretty=format:"%h %ad %s" --date=short -- "$USER_PATH" 2>/dev/null || echo "No git history")
EOF

echo -e "${GREEN}  ✅ Manifest: $MANIFEST_FILE${NC}"

# 4. Verification
echo -e "${BLUE}🔍 Verifying backup...${NC}"

# Check backup size
ORIGINAL_SIZE=$(du -sh "$USER_PATH" | cut -f1)
BACKUP_SIZE=$(du -sh "$PHYSICAL_BACKUP" | cut -f1)

echo -e "${GREEN}  Original size: $ORIGINAL_SIZE${NC}"
echo -e "${GREEN}  Backup size: $BACKUP_SIZE${NC}"

# Check file count
BACKUP_FILES=$(find "$PHYSICAL_BACKUP" -type f | wc -l)
echo -e "${GREEN}  Backup files: $BACKUP_FILES${NC}"

if [ "$FILE_COUNT" -eq "$BACKUP_FILES" ]; then
    echo -e "${GREEN}  ✅ File count matches${NC}"
else
    echo -e "${RED}  ❌ File count mismatch!${NC}"
    exit 1
fi

# 5. Create restore script
RESTORE_SCRIPT="$BACKUP_DIR/restore_$BACKUP_NAME.sh"
cat > "$RESTORE_SCRIPT" << 'EOF'
#!/bin/bash

# AUTO-GENERATED RESTORE SCRIPT
# Use this to restore user backup if needed

set -e

BACKUP_PATH="%BACKUP_PATH%"
TARGET_PATH="%TARGET_PATH%"
STASH_MESSAGE="%STASH_MESSAGE%"

echo "🔄 Restoring user feature from backup..."

# Method 1: Physical restore
if [ -d "$BACKUP_PATH" ]; then
    echo "📁 Restoring from physical backup..."
    rm -rf "$TARGET_PATH"
    cp -r "$BACKUP_PATH" "$TARGET_PATH"
    echo "✅ Physical restore complete"
fi

# Method 2: Git stash restore
if git stash list | grep -q "$STASH_MESSAGE"; then
    echo "🔄 Git stash found: $STASH_MESSAGE"
    echo "Run: git stash apply \$(git stash list | grep '$STASH_MESSAGE' | cut -d: -f1)"
fi

echo "✅ Restore options provided"
EOF

# Replace placeholders
sed -i "s|%BACKUP_PATH%|$PHYSICAL_BACKUP|g" "$RESTORE_SCRIPT"
sed -i "s|%TARGET_PATH%|$USER_PATH|g" "$RESTORE_SCRIPT"
sed -i "s|%STASH_MESSAGE%|$STASH_MESSAGE|g" "$RESTORE_SCRIPT"

chmod +x "$RESTORE_SCRIPT"
echo -e "${GREEN}  ✅ Restore script: $RESTORE_SCRIPT${NC}"

# 6. Summary
echo -e "${BLUE}📋 BACKUP SUMMARY${NC}"
echo -e "${BLUE}==================${NC}"
echo -e "${GREEN}✅ Physical backup: $PHYSICAL_BACKUP${NC}"
echo -e "${GREEN}✅ Git stash: $STASH_MESSAGE${NC}"
echo -e "${GREEN}✅ Manifest: $MANIFEST_FILE${NC}"
echo -e "${GREEN}✅ Restore script: $RESTORE_SCRIPT${NC}"
echo -e "${GREEN}✅ Total files backed up: $FILE_COUNT${NC}"
echo -e "${GREEN}✅ Total lines backed up: $TOTAL_LINES${NC}"

echo -e "${YELLOW}🚀 READY FOR FOUNDATION PULL!${NC}"
echo -e "${YELLOW}Now you can safely run: git pull origin main${NC}"

# 7. List existing backups
echo -e "${BLUE}📁 All user backups:${NC}"
ls -la "$BACKUP_DIR" | grep -E "(physical_user|manifest_user)" | tail -5

echo -e "${GREEN}🛡️ Backup complete! Your user work is safe.${NC}"
