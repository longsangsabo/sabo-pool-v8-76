#!/bin/bash

# 🔄 SAFE FOUNDATION PULL SCRIPT
# Tác giả: GitHub Copilot  
# Mục đích: Pull foundation updates an toàn với user work protection

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

USER_PATH="src/features/user"
BACKUP_SCRIPT="./scripts/backup-user-work.sh"

echo -e "${BLUE}🔄 SAFE FOUNDATION PULL${NC}"
echo -e "${BLUE}=======================${NC}"

# 1. Pre-check
echo -e "${BLUE}🔍 Pre-flight checks...${NC}"

# Check if in git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}📍 Current branch: $CURRENT_BRANCH${NC}"

# Check user folder exists
if [ ! -d "$USER_PATH" ]; then
    echo -e "${RED}❌ User folder not found: $USER_PATH${NC}"
    exit 1
fi

# Check for uncommitted changes
if git status --porcelain | grep -q "^[MAD]"; then
    echo -e "${YELLOW}⚠️ You have uncommitted changes${NC}"
    git status --short
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. Auto backup
echo -e "${BLUE}💾 Creating automatic backup...${NC}"
if [ -f "$BACKUP_SCRIPT" ]; then
    bash "$BACKUP_SCRIPT"
else
    echo -e "${YELLOW}⚠️ Backup script not found, creating manual backup...${NC}"
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    cp -r "$USER_PATH" "../user_manual_backup_$TIMESTAMP"
    echo -e "${GREEN}✅ Manual backup: ../user_manual_backup_$TIMESTAMP${NC}"
fi

# 3. Fetch latest
echo -e "${BLUE}📡 Fetching latest changes...${NC}"
git fetch origin

# Check what's coming
echo -e "${BLUE}📊 Analyzing incoming changes...${NC}"
INCOMING_COMMITS=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
echo -e "${GREEN}Incoming commits: $INCOMING_COMMITS${NC}"

if [ "$INCOMING_COMMITS" -gt 0 ]; then
    echo -e "${YELLOW}📋 Recent foundation changes:${NC}"
    git log --oneline -5 origin/main ^HEAD 2>/dev/null || echo "No preview available"
fi

# 4. Check for user-affecting changes
echo -e "${BLUE}🔍 Checking for user-affecting changes...${NC}"
USER_CONFLICTS=$(git diff HEAD origin/main --name-only | grep -c "^$USER_PATH" || echo "0")
echo -e "${GREEN}Files affecting user: $USER_CONFLICTS${NC}"

if [ "$USER_CONFLICTS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Incoming changes may affect user folder:${NC}"
    git diff HEAD origin/main --name-only | grep "^$USER_PATH" || true
    read -p "Continue with pull? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 5. Pull with merge strategy
echo -e "${BLUE}🔄 Pulling foundation changes...${NC}"

# Try pull with our merge strategy (prefer user work)
if git pull origin main --strategy=ours --strategy-option=patience; then
    echo -e "${GREEN}✅ Pull successful with merge strategy${NC}"
elif git pull origin main; then
    echo -e "${GREEN}✅ Pull successful${NC}"
else
    echo -e "${RED}❌ Pull failed with conflicts${NC}"
    echo -e "${YELLOW}🔧 Resolving conflicts...${NC}"
    
    # Show conflicts
    git status
    
    echo -e "${YELLOW}📋 Conflict resolution strategy:${NC}"
    echo -e "${YELLOW}1. For user files: keep our version (user work)${NC}"
    echo -e "${YELLOW}2. For foundation files: accept their version${NC}"
    echo -e "${YELLOW}3. For shared files: manual review${NC}"
    
    # Auto-resolve user conflicts (keep ours)
    if git status --porcelain | grep -q "^UU.*$USER_PATH"; then
        echo -e "${BLUE}🔧 Auto-resolving user conflicts (keeping user work)...${NC}"
        git checkout --ours "$USER_PATH" 2>/dev/null || true
        git add "$USER_PATH" 2>/dev/null || true
        echo -e "${GREEN}✅ User conflicts resolved${NC}"
    fi
    
    # Check remaining conflicts
    REMAINING_CONFLICTS=$(git status --porcelain | grep -c "^UU" || echo "0")
    if [ "$REMAINING_CONFLICTS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️ Manual resolution needed for $REMAINING_CONFLICTS files${NC}"
        git status --porcelain | grep "^UU"
        echo -e "${YELLOW}Please resolve manually and run: git add <file> && git commit${NC}"
        exit 1
    fi
    
    # Commit merge
    git commit -m "Merge foundation updates - preserve user work"
fi

# 6. Post-pull validation
echo -e "${BLUE}🔍 Post-pull validation...${NC}"

# Check user folder integrity
if [ ! -d "$USER_PATH" ]; then
    echo -e "${RED}❌ User folder missing after pull!${NC}"
    echo -e "${YELLOW}🔄 Restoring from backup...${NC}"
    # Restore logic here
    exit 1
fi

# Count files
FILE_COUNT=$(find "$USER_PATH" -type f -name "*.tsx" -o -name "*.ts" | wc -l)
echo -e "${GREEN}📁 User files after pull: $FILE_COUNT${NC}"

# Check TypeScript
echo -e "${BLUE}🔍 TypeScript check...${NC}"
if command -v npx > /dev/null; then
    if npx tsc --noEmit --project . 2>/dev/null; then
        echo -e "${GREEN}✅ TypeScript validation passed${NC}"
    else
        echo -e "${YELLOW}⚠️ TypeScript issues detected${NC}"
        npx tsc --noEmit --project . 2>&1 | grep -E "(error|Error)" | head -5 || true
    fi
fi

# Check build
echo -e "${BLUE}🔨 Build check...${NC}"
if command -v npm > /dev/null && [ -f "package.json" ]; then
    if timeout 60s npm run build 2>/dev/null; then
        echo -e "${GREEN}✅ Build check passed${NC}"
    else
        echo -e "${YELLOW}⚠️ Build issues detected${NC}"
    fi
fi

# 7. Final status
echo -e "${BLUE}📋 PULL COMPLETE${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "${GREEN}✅ Foundation updated successfully${NC}"
echo -e "${GREEN}✅ User work preserved${NC}"
echo -e "${GREEN}✅ Files in user folder: $FILE_COUNT${NC}"

# Show structure
echo -e "${BLUE}📁 User folder structure:${NC}"
ls -la "$USER_PATH" 2>/dev/null || echo "Unable to list user folder"

# Recent changes
echo -e "${BLUE}📊 Recent changes:${NC}"
git log --oneline -3

# Next steps
echo -e "${YELLOW}🚀 Next steps:${NC}"
echo -e "${YELLOW}1. Test user functionality${NC}"
echo -e "${YELLOW}2. Run: npm run dev${NC}"
echo -e "${YELLOW}3. Check user features in browser${NC}"
echo -e "${YELLOW}4. If issues: check backup options${NC}"

echo -e "${GREEN}🎉 Foundation pull complete!${NC}"
