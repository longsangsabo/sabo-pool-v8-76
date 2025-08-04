#!/bin/bash

# 🪝 Git Hooks for Documentation Automation
# Ensures docs stay in sync with code changes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
DOCS_SCRIPTS_DIR="$PROJECT_ROOT/docs/scripts"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[DOCS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[DOCS]${NC} $1"
}

error() {
    echo -e "${RED}[DOCS]${NC} $1"
}

# Pre-commit hook
pre_commit() {
    log "🔍 Pre-commit: Validating documentation..."
    
    # Check if TypeScript files changed
    if git diff --cached --name-only | grep -E '\.(ts|tsx)$' > /dev/null; then
        log "TypeScript files changed, checking documentation completeness..."
        
        # Run AST parser to check for undocumented exports
        cd "$PROJECT_ROOT"
        if command -v node >/dev/null 2>&1; then
            node "$DOCS_SCRIPTS_DIR/ast-parser.cjs" > /tmp/ast-check.log 2>&1 || {
                warn "AST parsing failed, check /tmp/ast-check.log"
            }
        fi
    fi
    
    # Check documentation files for basic quality
    if git diff --cached --name-only | grep -E '\.md$' > /dev/null; then
        log "Documentation files changed, running quality checks..."
        
        # Basic markdown validation
        for file in $(git diff --cached --name-only | grep -E '\.md$'); do
            if [ -f "$file" ]; then
                # Check for basic metadata
                if ! grep -q "^*#tags:" "$file"; then
                    warn "Missing metadata tags in: $file"
                fi
                
                # Check for broken links (basic check)
                if grep -E '\]\([^)]*\.(md|html)\)' "$file" | grep -E '\]\(\.\./' > /dev/null; then
                    warn "Relative links detected in: $file (verify they're correct)"
                fi
            fi
        done
    fi
    
    log "✅ Pre-commit validation complete"
}

# Post-commit hook
post_commit() {
    log "📝 Post-commit: Updating documentation..."
    
    cd "$PROJECT_ROOT"
    
    # Check if TypeScript files were modified
    if git show --name-only | grep -E '\.(ts|tsx)$' > /dev/null; then
        log "TypeScript changes detected, regenerating API docs..."
        
        if command -v node >/dev/null 2>&1; then
            # Regenerate auto-docs in background
            (
                node "$DOCS_SCRIPTS_DIR/ast-parser.cjs" > /dev/null 2>&1
                node "$DOCS_SCRIPTS_DIR/template-generator.cjs" > /dev/null 2>&1
            ) &
        fi
    fi
    
    # Update auto-changelog
    if [ -f "$DOCS_SCRIPTS_DIR/update-changelog.cjs" ]; then
        node "$DOCS_SCRIPTS_DIR/update-changelog.cjs" "$(git log -1 --pretty=format:'%H')" > /dev/null 2>&1 &
    fi
    
    log "✅ Post-commit documentation update initiated"
}

# Post-merge hook
post_merge() {
    log "🔄 Post-merge: Synchronizing documentation..."
    
    cd "$PROJECT_ROOT"
    
    # Check if package.json changed (version update)
    if git show --name-only | grep -E 'package\.json$' > /dev/null; then
        log "Package.json changed, updating version references..."
        
        if command -v node >/dev/null 2>&1 && [ -f "$DOCS_SCRIPTS_DIR/doc-fixer.cjs" ]; then
            node "$DOCS_SCRIPTS_DIR/doc-fixer.cjs" > /dev/null 2>&1 &
        fi
    fi
    
    # Full regeneration if many files changed
    CHANGED_FILES=$(git show --name-only | wc -l)
    if [ "$CHANGED_FILES" -gt 10 ]; then
        log "Major changes detected ($CHANGED_FILES files), full doc regeneration..."
        
        if command -v node >/dev/null 2>&1; then
            (
                node "$DOCS_SCRIPTS_DIR/ast-parser.cjs" > /dev/null 2>&1
                node "$DOCS_SCRIPTS_DIR/template-generator.cjs" > /dev/null 2>&1
                node "$DOCS_SCRIPTS_DIR/doc-fixer.cjs" > /dev/null 2>&1
            ) &
        fi
    fi
    
    log "✅ Post-merge documentation sync initiated"
}

# Install git hooks
install_hooks() {
    log "📦 Installing git hooks for documentation automation..."
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
        exit 1
    fi

    # Check if husky is configured
    HUSKY_DIR="$(git config --get core.hooksPath)"
    
    if [ -n "$HUSKY_DIR" ] && [ -d "$HUSKY_DIR" ]; then
        log "Detected Husky git hooks configuration in $HUSKY_DIR"
        
        # Update existing pre-commit hook
        if [ -f "$PROJECT_ROOT/.husky/pre-commit" ]; then
            log "Updating existing Husky pre-commit hook..."
            
            # Check if our documentation hook is already in the file
            if ! grep -q "docs/scripts/git-hooks.sh" "$PROJECT_ROOT/.husky/pre-commit"; then
                echo "" >> "$PROJECT_ROOT/.husky/pre-commit"
                echo "# Documentation automation" >> "$PROJECT_ROOT/.husky/pre-commit"
                echo "bash docs/scripts/git-hooks.sh pre-commit" >> "$PROJECT_ROOT/.husky/pre-commit"
            fi
        else
            log "Creating new Husky pre-commit hook..."
            cat > "$PROJECT_ROOT/.husky/pre-commit" << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Documentation automation
bash docs/scripts/git-hooks.sh pre-commit
EOF
            chmod +x "$PROJECT_ROOT/.husky/pre-commit"
        fi
        
        # Update post-commit hook (read existing content first)
        if [ -f "$PROJECT_ROOT/.husky/post-commit" ]; then
            log "Updating existing Husky post-commit hook..."
            
            if ! grep -q "docs/scripts/git-hooks.sh" "$PROJECT_ROOT/.husky/post-commit"; then
                echo "" >> "$PROJECT_ROOT/.husky/post-commit"
                echo "# Documentation automation" >> "$PROJECT_ROOT/.husky/post-commit"
                echo "bash docs/scripts/git-hooks.sh post-commit" >> "$PROJECT_ROOT/.husky/post-commit"
            fi
        else
            log "Creating new Husky post-commit hook..."
            cat > "$PROJECT_ROOT/.husky/post-commit" << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Documentation automation
bash docs/scripts/git-hooks.sh post-commit
EOF
            chmod +x "$PROJECT_ROOT/.husky/post-commit"
        fi
    else
        # Get standard git hooks directory
        GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
        
        if [ ! -d "$GIT_HOOKS_DIR" ]; then
            error "Git hooks directory not found. Are you in a git repository?"
            exit 1
        fi
        
        install_standard_hooks
    fi
    
    log "✅ Git hooks installed successfully"
}

# Install hooks for Husky
install_husky_hooks() {
    local HUSKY_DIR="$PROJECT_ROOT/$(git config --get core.hooksPath)"
    
    # Create or update pre-commit hook
    if [ -f "$HUSKY_DIR/pre-commit" ]; then
        log "Updating existing Husky pre-commit hook..."
        
        # Check if our documentation hook is already in the file
        if ! grep -q "docs/scripts/git-hooks.sh" "$HUSKY_DIR/pre-commit"; then
            echo "" >> "$HUSKY_DIR/pre-commit"
            echo "# Documentation automation" >> "$HUSKY_DIR/pre-commit"
            echo "source \"\$(dirname \"\$0\")/../../docs/scripts/git-hooks.sh\"" >> "$HUSKY_DIR/pre-commit"
            echo "pre_commit" >> "$HUSKY_DIR/pre-commit"
        fi
    else
        log "Creating new Husky pre-commit hook..."
        cat > "$HUSKY_DIR/pre-commit" << 'EOF'
#!/bin/bash
# Documentation automation
source "$(dirname "$0")/../../docs/scripts/git-hooks.sh"
pre_commit
EOF
        chmod +x "$HUSKY_DIR/pre-commit"
    fi
    
    # Create or update post-commit hook
    if [ -f "$HUSKY_DIR/post-commit" ]; then
        log "Updating existing Husky post-commit hook..."
        
        if ! grep -q "docs/scripts/git-hooks.sh" "$HUSKY_DIR/post-commit"; then
            echo "" >> "$HUSKY_DIR/post-commit"
            echo "# Documentation automation" >> "$HUSKY_DIR/post-commit"
            echo "source \"\$(dirname \"\$0\")/../../docs/scripts/git-hooks.sh\"" >> "$HUSKY_DIR/post-commit"
            echo "post_commit" >> "$HUSKY_DIR/post-commit"
        fi
    else
        log "Creating new Husky post-commit hook..."
        cat > "$HUSKY_DIR/post-commit" << 'EOF'
#!/bin/bash
# Documentation automation
source "$(dirname "$0")/../../docs/scripts/git-hooks.sh"
post_commit
EOF
        chmod +x "$HUSKY_DIR/post-commit"
    fi
}

# Install standard git hooks
install_standard_hooks() {
    local GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
    
    # Create pre-commit hook
    cat > "$GIT_HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/../../docs/scripts/git-hooks.sh"
pre_commit
EOF
    
    # Create post-commit hook
    cat > "$GIT_HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/../../docs/scripts/git-hooks.sh"
post_commit
EOF
    
    # Create post-merge hook
    cat > "$GIT_HOOKS_DIR/post-merge" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/../../docs/scripts/git-hooks.sh"
post_merge
EOF
    
    # Make hooks executable
    chmod +x "$GIT_HOOKS_DIR/pre-commit"
    chmod +x "$GIT_HOOKS_DIR/post-commit" 
    chmod +x "$GIT_HOOKS_DIR/post-merge"
    
    log "✅ Git hooks installed successfully!"
    log "📝 Documentation will now auto-update on git operations"
}

# Uninstall git hooks
uninstall_hooks() {
    log "🗑️ Removing git hooks..."
    
    GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
    
    rm -f "$GIT_HOOKS_DIR/pre-commit"
    rm -f "$GIT_HOOKS_DIR/post-commit"
    rm -f "$GIT_HOOKS_DIR/post-merge"
    
    log "✅ Git hooks removed"
}

# Main script logic
case "${1:-}" in
    "install")
        install_hooks
        ;;
    "uninstall")
        uninstall_hooks
        ;;
    "pre-commit")
        pre_commit
        ;;
    "post-commit")
        post_commit
        ;;
    "post-merge")
        post_merge
        ;;
    *)
        echo "Usage: $0 {install|uninstall|pre-commit|post-commit|post-merge}"
        echo ""
        echo "Commands:"
        echo "  install    - Install git hooks for automatic documentation"
        echo "  uninstall  - Remove git hooks"
        echo "  pre-commit - Run pre-commit documentation validation"
        echo "  post-commit- Run post-commit documentation update"
        echo "  post-merge - Run post-merge documentation sync"
        exit 1
        ;;
esac
