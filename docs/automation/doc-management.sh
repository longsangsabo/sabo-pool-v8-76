#!/bin/bash

# 🤖 Documentation Management Automation Script
# Validates naming conventions, detects stale docs, and maintains doc index

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCS_DIR="docs"
ARCHIVE_DIR="docs/archive"
WORKING_DIR="docs/working"
TEMPLATES_DIR="docs/templates"
STALE_DAYS=90
INDEX_FILE="docs/DOC_INDEX.md"

# Valid prefixes
VALID_PREFIXES=("TEST_" "SETUP_" "DEV_" "DEPLOY_" "GUIDE_" "PLAN_" "REPORT_" "API_" "ARCH_" "SECURITY_")

echo -e "${BLUE}🤖 Documentation Management Automation${NC}"
echo "=================================="

# Function to log messages
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate naming conventions
validate_naming() {
    log "🏷️ Validating naming conventions..."
    
    local violations=0
    
    # Check files in main docs directory
    while IFS= read -r -d '' file; do
        filename=$(basename "$file")
        
        # Skip special files
        if [[ "$filename" == "README.md" ]] || \
           [[ "$filename" == "DOC_INDEX.md" ]] || \
           [[ "$filename" == "DOC_GUIDELINES.md" ]] || \
           [[ "$filename" == "CONSOLIDATION_CHANGE_LOG.md" ]] || \
           [[ "$filename" == "FINAL_STATUS_REPORT.md" ]]; then
            continue
        fi
        
        # Check if file has valid prefix
        has_valid_prefix=false
        for prefix in "${VALID_PREFIXES[@]}"; do
            if [[ "$filename" == "$prefix"* ]]; then
                has_valid_prefix=true
                break
            fi
        done
        
        if ! $has_valid_prefix; then
            error "❌ Invalid naming: $filename (missing valid prefix)"
            ((violations++))
        else
            # Check naming pattern: PREFIX_main-topic[-subtopic].md
            if [[ ! "$filename" =~ ^[A-Z]+_[a-z0-9]+(-[a-z0-9]+)*\.md$ ]]; then
                warn "⚠️  Naming concern: $filename (should follow PREFIX_main-topic[-subtopic].md pattern)"
            fi
        fi
    done < <(find "$DOCS_DIR" -maxdepth 1 -name "*.md" -type f -print0)
    
    if [ $violations -eq 0 ]; then
        log "✅ All files follow naming conventions"
    else
        error "Found $violations naming violations"
        return 1
    fi
}

# Function to detect stale documents
detect_stale() {
    log "📅 Detecting stale documents (older than $STALE_DAYS days)..."
    
    local stale_files=()
    local current_date=$(date +%s)
    local stale_threshold=$((current_date - (STALE_DAYS * 24 * 60 * 60)))
    
    while IFS= read -r -d '' file; do
        if [ -f "$file" ]; then
            file_date=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
            if [ "$file_date" -lt "$stale_threshold" ]; then
                stale_files+=("$file")
            fi
        fi
    done < <(find "$DOCS_DIR" -name "*.md" -type f -not -path "$ARCHIVE_DIR/*" -not -path "$TEMPLATES_DIR/*" -print0)
    
    if [ ${#stale_files[@]} -eq 0 ]; then
        log "✅ No stale documents found"
    else
        warn "Found ${#stale_files[@]} stale documents:"
        for file in "${stale_files[@]}"; do
            file_age_days=$(( (current_date - $(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)) / 86400 ))
            warn "  📄 $file ($file_age_days days old)"
        done
        
        echo ""
        echo "💡 Suggestions:"
        echo "  • Review these files for relevance"
        echo "  • Update if still needed: touch filename.md"
        echo "  • Archive if outdated: git mv filename.md docs/archive/$(date +%Y-%m)_filename.md"
    fi
}

# Function to suggest archiving
suggest_archiving() {
    log "🗂️ Suggesting files for archiving..."
    
    # Find completed task files
    local completed_files=()
    while IFS= read -r -d '' file; do
        if grep -qi -E "(completed|done|finished|success|✅)" "$file" > /dev/null 2>&1; then
            completed_files+=("$file")
        fi
    done < <(find "$DOCS_DIR" -name "*.md" -type f -not -path "$ARCHIVE_DIR/*" -not -path "$TEMPLATES_DIR/*" -print0)
    
    if [ ${#completed_files[@]} -gt 0 ]; then
        warn "Files that might be ready for archiving (contain completion indicators):"
        for file in "${completed_files[@]}"; do
            warn "  📄 $file"
        done
        echo ""
        echo "💡 Consider archiving completed task documentation"
    fi
    
    # Find old report files
    local old_reports=()
    while IFS= read -r -d '' file; do
        if [[ "$(basename "$file")" == REPORT_* ]]; then
            old_reports+=("$file")
        fi
    done < <(find "$DOCS_DIR" -name "REPORT_*.md" -type f -not -path "$ARCHIVE_DIR/*" -print0)
    
    if [ ${#old_reports[@]} -gt 3 ]; then
        warn "Multiple report files found. Consider archiving older reports:"
        for file in "${old_reports[@]}"; do
            warn "  📄 $file"
        done
    fi
}

# Function to generate documentation index
generate_index() {
    log "📚 Generating documentation index..."
    
    cat > "$INDEX_FILE" << 'EOF'
# 📚 Documentation Index

*Auto-generated on: $(date '+%Y-%m-%d %H:%M:%S')*

## 🎯 Essential Documentation

### 📋 Core Guides
EOF

    # Add consolidated guides
    echo "" >> "$INDEX_FILE"
    while IFS= read -r -d '' file; do
        filename=$(basename "$file")
        title=$(head -1 "$file" | sed 's/^# //' | sed 's/📋\|🧪\|⚙️\|💻\|🚀\|📘//g' | xargs)
        echo "- [\`$filename\`](./$filename) - $title" >> "$INDEX_FILE"
    done < <(find "$DOCS_DIR" -maxdepth 1 -name "*.md" -type f \( -name "TEST_*" -o -name "SETUP_*" -o -name "DEV_*" -o -name "DEPLOY_*" -o -name "GUIDE_*" \) -print0 | sort -z)
    
    cat >> "$INDEX_FILE" << 'EOF'

## 📁 Documentation Structure

### 🏗️ Folder Organization
```
docs/
├── 📋 [PREFIX]_[descriptive-name].md     ← Main consolidated docs
├── essential/                            ← Top 10 critical docs
├── working/                              ← Drafts & WIP documents  
├── archive/                              ← Historical & deprecated
├── templates/                            ← Document templates
├── automation/                           ← Management scripts
└── team-resources/                       ← Onboarding & reference
```

### 🏷️ Naming Conventions
| Prefix | Purpose | Example |
|--------|---------|---------|
| `TEST_` | Testing documentation | `TEST_comprehensive-guide.md` |
| `SETUP_` | Setup & configuration | `SETUP_complete-guide.md` |
| `DEV_` | Development guides | `DEV_complete-guide.md` |
| `DEPLOY_` | Deployment procedures | `DEPLOY_production-checklist.md` |
| `GUIDE_` | General guides | `GUIDE_complete-project.md` |
| `PLAN_` | Project planning | `PLAN_roadmap-2025.md` |
| `REPORT_` | Status reports | `REPORT_monthly-progress.md` |
| `API_` | API documentation | `API_authentication-guide.md` |

## 📂 All Documentation Files

### 📋 Main Documentation
EOF

    # List all main docs files
    echo "" >> "$INDEX_FILE"
    while IFS= read -r -d '' file; do
        filename=$(basename "$file")
        if [[ ! "$filename" == "DOC_INDEX.md" ]] && [[ ! "$filename" == "README.md" ]]; then
            title=$(head -1 "$file" | sed 's/^# //' | sed 's/📋\|🧪\|⚙️\|💻\|🚀\|📘\|📊\|🔧//g' | xargs)
            echo "- [\`$filename\`](./$filename) - $title" >> "$INDEX_FILE"
        fi
    done < <(find "$DOCS_DIR" -maxdepth 1 -name "*.md" -type f -print0 | sort -z)
    
    # Add subdirectories
    for subdir in "essential" "working" "guides" "completed-tasks"; do
        if [ -d "$DOCS_DIR/$subdir" ]; then
            echo "" >> "$INDEX_FILE"
            echo "### 📁 $subdir/" >> "$INDEX_FILE"
            while IFS= read -r -d '' file; do
                filename=$(basename "$file")
                relative_path="$subdir/$filename"
                title=$(head -1 "$file" | sed 's/^# //' | sed 's/📋\|🧪\|⚙️\|💻\|🚀\|📘\|📊\|🔧//g' | xargs)
                echo "- [\`$filename\`](./$relative_path) - $title" >> "$INDEX_FILE"
            done < <(find "$DOCS_DIR/$subdir" -name "*.md" -type f -print0 | sort -z)
        fi
    done
    
    cat >> "$INDEX_FILE" << 'EOF'

## 🛠️ Quick Actions

### 📝 Create New Document
```bash
# Copy appropriate template
cp docs/templates/[PREFIX]_template.md docs/[PREFIX]_your-topic.md

# Edit the new document
code docs/[PREFIX]_your-topic.md
```

### 🔍 Find Documentation
```bash
# Search by content
grep -r "search term" docs/

# Find by filename pattern  
find docs/ -name "*pattern*"

# List recent documents
find docs/ -name "*.md" -mtime -7
```

### 🧹 Maintenance
```bash
# Run automation checks
./docs/automation/doc-management.sh

# Validate naming conventions
npm run docs:validate-naming

# Generate fresh index
npm run docs:generate-index
```

## 📊 Documentation Statistics

- **Total Files**: $(find docs/ -name "*.md" -type f | wc -l)
- **Main Docs**: $(find docs/ -maxdepth 1 -name "*.md" -type f | wc -l)
- **Templates**: $(find docs/templates/ -name "*.md" -type f 2>/dev/null | wc -l || echo "0")
- **Archived**: $(find docs/archive/ -name "*.md" -type f 2>/dev/null | wc -l || echo "0")

---

**Auto-generated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Generator**: `docs/automation/doc-management.sh`  
**Status**: ✅ Index Current
EOF

    # Replace template expressions with actual values
    sed -i.bak "s/\$(date '+%Y-%m-%d %H:%M:%S')/$(date '+%Y-%m-%d %H:%M:%S')/g" "$INDEX_FILE"
    sed -i.bak "s/\$(find docs\/ -name \"\*.md\" -type f | wc -l)/$(find docs/ -name "*.md" -type f | wc -l)/g" "$INDEX_FILE"
    sed -i.bak "s/\$(find docs\/ -maxdepth 1 -name \"\*.md\" -type f | wc -l)/$(find docs/ -maxdepth 1 -name "*.md" -type f | wc -l)/g" "$INDEX_FILE"
    sed -i.bak "s/\$(find docs\/templates\/ -name \"\*.md\" -type f 2>\/dev\/null | wc -l || echo \"0\")/$(find docs/templates/ -name "*.md" -type f 2>/dev/null | wc -l || echo "0")/g" "$INDEX_FILE"
    sed -i.bak "s/\$(find docs\/archive\/ -name \"\*.md\" -type f 2>\/dev\/null | wc -l || echo \"0\")/$(find docs/archive/ -name "*.md" -type f 2>/dev/null | wc -l || echo "0")/g" "$INDEX_FILE"
    
    # Clean up backup file
    rm -f "$INDEX_FILE.bak"
    
    log "✅ Documentation index generated: $INDEX_FILE"
}

# Function to validate template compliance
validate_templates() {
    log "📋 Validating template compliance..."
    
    local non_compliant=()
    
    while IFS= read -r -d '' file; do
        filename=$(basename "$file")
        
        # Skip special files and templates
        if [[ "$filename" == "README.md" ]] || \
           [[ "$filename" == "DOC_INDEX.md" ]] || \
           [[ "$filename" == "DOC_GUIDELINES.md" ]] || \
           [[ "$file" == *"/templates/"* ]]; then
            continue
        fi
        
        # Check for required metadata
        if ! grep -q "^*#tags:" "$file" > /dev/null 2>&1; then
            non_compliant+=("$file (missing #tags)")
        fi
        
        if ! grep -q "^\*\*Last Updated\*\*:" "$file" > /dev/null 2>&1; then
            non_compliant+=("$file (missing Last Updated)")
        fi
        
        if ! grep -q "^\*\*Status\*\*:" "$file" > /dev/null 2>&1; then
            non_compliant+=("$file (missing Status)")
        fi
        
    done < <(find "$DOCS_DIR" -name "*.md" -type f -not -path "$ARCHIVE_DIR/*" -print0)
    
    if [ ${#non_compliant[@]} -eq 0 ]; then
        log "✅ All documents follow template structure"
    else
        warn "Found ${#non_compliant[@]} template compliance issues:"
        for issue in "${non_compliant[@]}"; do
            warn "  📄 $issue"
        done
        echo ""
        echo "💡 Add missing metadata headers using templates as reference"
    fi
}

# Function to check for broken links
check_links() {
    log "🔗 Checking for broken internal links..."
    
    local broken_links=()
    
    while IFS= read -r -d '' file; do
        # Extract markdown links
        while IFS= read -r link; do
            if [[ "$link" == *.md* ]] && [[ ! "$link" == http* ]]; then
                # Clean up the link path
                link_path=$(echo "$link" | sed 's/.*(\([^)]*\)).*/\1/' | sed 's/#.*//')
                
                # Check if file exists relative to current file
                file_dir=$(dirname "$file")
                full_path="$file_dir/$link_path"
                
                if [[ ! -f "$full_path" ]] && [[ ! -f "$link_path" ]]; then
                    broken_links+=("$file -> $link_path")
                fi
            fi
        done < <(grep -o '\[.*\](.*\.md[^)]*)' "$file" 2>/dev/null || true)
    done < <(find "$DOCS_DIR" -name "*.md" -type f -print0)
    
    if [ ${#broken_links[@]} -eq 0 ]; then
        log "✅ No broken internal links found"
    else
        warn "Found ${#broken_links[@]} potentially broken links:"
        for link in "${broken_links[@]}"; do
            warn "  🔗 $link"
        done
    fi
}

# Main execution
main() {
    echo ""
    
    # Create necessary directories
    mkdir -p "$ARCHIVE_DIR" "$WORKING_DIR" "$TEMPLATES_DIR"
    
    # Run all checks
    validate_naming
    echo ""
    
    detect_stale
    echo ""
    
    suggest_archiving
    echo ""
    
    validate_templates
    echo ""
    
    check_links
    echo ""
    
    generate_index
    echo ""
    
    log "🎉 Documentation management complete!"
    echo ""
    echo "📊 Summary:"
    echo "  • Naming conventions: $([ $? -eq 0 ] && echo "✅ Valid" || echo "❌ Issues found")"
    echo "  • Template compliance: Checked"
    echo "  • Stale detection: Complete"
    echo "  • Index generation: ✅ Updated"
    echo "  • Link validation: Complete"
    echo ""
    echo "📖 View the documentation index: cat docs/DOC_INDEX.md"
}

# Run if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
