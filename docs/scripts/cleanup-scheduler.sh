#!/bin/bash

# 🧹 Documentation Cleanup Scheduler
# Automated cleanup scheduling and management

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="$PROJECT_ROOT/docs/scripts"
DOCS_DIR="$PROJECT_ROOT/docs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[CLEANUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[CLEANUP]${NC} $1"
}

error() {
    echo -e "${RED}[CLEANUP]${NC} $1"
}

info() {
    echo -e "${BLUE}[CLEANUP]${NC} $1"
}

# Check if Node.js is available
check_node() {
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js is required but not installed"
        exit 1
    fi
}

# Run full cleanup
run_full_cleanup() {
    log "🧹 Starting full documentation cleanup..."
    
    cd "$PROJECT_ROOT"
    
    if [ ! -f "$SCRIPTS_DIR/doc-cleaner.cjs" ]; then
        error "doc-cleaner.cjs not found"
        exit 1
    fi
    
    node "$SCRIPTS_DIR/doc-cleaner.cjs"
    
    log "✅ Full cleanup completed"
}

# Run quick cleanup (temp files only)
run_quick_cleanup() {
    log "🧹 Starting quick cleanup (temp files)..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/doc-cleaner.cjs" --no-duplicates --no-orphans --no-optimization --no-validation
    
    log "✅ Quick cleanup completed"
}

# Run duplicate detection only
run_duplicate_scan() {
    log "🔍 Starting duplicate detection..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/doc-cleaner.cjs" --no-orphans --no-optimization --no-maintenance --no-validation
    
    log "✅ Duplicate scan completed"
}

# Run orphan cleanup only
run_orphan_cleanup() {
    log "🔗 Starting orphan cleanup..."
    
    cd "$PROJECT_ROOT"
    node "$SCRIPTS_DIR/doc-cleaner.cjs" --no-duplicates --no-optimization --no-maintenance --no-validation
    
    log "✅ Orphan cleanup completed"
}

# Archive old files
archive_old_files() {
    log "📦 Archiving old files..."
    
    cd "$PROJECT_ROOT"
    
    # Find files older than 6 months
    find "$DOCS_DIR" -name "*.md" -type f -mtime +180 -not -path "*/auto-generated/*" -not -path "*/scripts/*" -not -name "README.md" -not -name "index.md" | while read file; do
        if [ -f "$file" ]; then
            # Create archive directory
            archive_dir="$DOCS_DIR/archive/old-files/$(date +%Y-%m)"
            mkdir -p "$archive_dir"
            
            # Move file to archive
            basename=$(basename "$file")
            mv "$file" "$archive_dir/$basename"
            log "Archived: $file"
        fi
    done
    
    log "✅ Old files archived"
}

# Clean temporary files
clean_temp_files() {
    log "🗑️ Cleaning temporary files..."
    
    cd "$PROJECT_ROOT"
    
    # Remove common temp file patterns
    find "$DOCS_DIR" -type f \( \
        -name "*.bak" -o \
        -name "*.tmp" -o \
        -name "*.temp" -o \
        -name "*~" -o \
        -name ".DS_Store" -o \
        -name "Thumbs.db" -o \
        -name "*.swp" -o \
        -name "#*#" \
    \) -delete
    
    # Remove empty directories
    find "$DOCS_DIR" -type d -empty -not -path "*/auto-generated" -not -path "*/scripts" -delete
    
    log "✅ Temporary files cleaned"
}

# Generate cleanup metrics
generate_metrics() {
    log "📊 Generating cleanup metrics..."
    
    cd "$PROJECT_ROOT"
    
    # Count files by type
    total_docs=$(find "$DOCS_DIR" -name "*.md" -type f | wc -l)
    auto_generated=$(find "$DOCS_DIR/auto-generated" -name "*.md" -type f 2>/dev/null | wc -l || echo "0")
    essential_docs=$(find "$DOCS_DIR/essential" -name "*.md" -type f 2>/dev/null | wc -l || echo "0")
    archived_docs=$(find "$DOCS_DIR/archive" -name "*.md" -type f 2>/dev/null | wc -l || echo "0")
    
    # Calculate sizes
    total_size=$(du -sh "$DOCS_DIR" 2>/dev/null | cut -f1 || echo "0")
    docs_size=$(find "$DOCS_DIR" -name "*.md" -type f -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1 || echo "0")
    
    # Create metrics report
    metrics_file="$DOCS_DIR/auto-generated/cleanup-metrics.md"
    cat > "$metrics_file" << EOF
# 📊 Documentation Cleanup Metrics

*Generated*: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## 📈 Current State

| Metric | Count | Notes |
|--------|--------|-------|
| **Total Docs** | $total_docs | All .md files |
| **Essential Docs** | $essential_docs | Core documentation |
| **Auto-generated** | $auto_generated | System generated |
| **Archived** | $archived_docs | Moved to archive |

## 💾 Storage

| Type | Size |
|------|------|
| **Total docs directory** | $total_size |
| **Documentation files** | $docs_size |

## 🎯 Cleanup Targets

- **Target essential docs**: 40-50 files
- **Current reduction**: $(( (archived_docs * 100) / (total_docs + archived_docs) ))% files archived
- **Status**: $(if [ $essential_docs -le 50 ]; then echo "✅ Target achieved"; else echo "⚠️ Needs more cleanup"; fi)

## 🔄 Cleanup Schedule

- **Daily**: Temp file cleanup
- **Weekly**: Quick orphan scan  
- **Monthly**: Full duplicate detection
- **Quarterly**: Deep cleanup with optimization

---
*Generated by Documentation Cleanup System*
EOF
    
    log "✅ Metrics generated: $metrics_file"
    
    # Display summary
    info "📊 Current metrics:"
    info "   Total docs: $total_docs"
    info "   Essential: $essential_docs"
    info "   Archived: $archived_docs"
    info "   Size: $total_size"
}

# Install cleanup scheduling
install_cron_jobs() {
    log "⏰ Installing cleanup schedule..."
    
    # Check if cron is available
    if ! command -v crontab >/dev/null 2>&1; then
        warn "Cron not available, skipping scheduled cleanup installation"
        return
    fi
    
    # Create cron jobs
    cron_file="/tmp/docs_cleanup_cron"
    cat > "$cron_file" << EOF
# Documentation cleanup schedule
# Daily temp file cleanup at 2 AM
0 2 * * * cd "$PROJECT_ROOT" && bash "$SCRIPTS_DIR/cleanup-scheduler.sh" temp >/dev/null 2>&1

# Weekly orphan cleanup on Sunday at 3 AM  
0 3 * * 0 cd "$PROJECT_ROOT" && bash "$SCRIPTS_DIR/cleanup-scheduler.sh" orphans >/dev/null 2>&1

# Monthly full cleanup on 1st day at 4 AM
0 4 1 * * cd "$PROJECT_ROOT" && bash "$SCRIPTS_DIR/cleanup-scheduler.sh" full >/dev/null 2>&1

# Generate metrics daily at 1 AM
0 1 * * * cd "$PROJECT_ROOT" && bash "$SCRIPTS_DIR/cleanup-scheduler.sh" metrics >/dev/null 2>&1
EOF
    
    # Install cron jobs
    crontab "$cron_file"
    rm "$cron_file"
    
    log "✅ Cleanup schedule installed"
    info "Schedule:"
    info "  Daily 2 AM: Temp file cleanup"
    info "  Weekly Sunday 3 AM: Orphan cleanup"
    info "  Monthly 1st 4 AM: Full cleanup"
    info "  Daily 1 AM: Generate metrics"
}

# Remove scheduled cleanup
remove_cron_jobs() {
    log "🗑️ Removing cleanup schedule..."
    
    if command -v crontab >/dev/null 2>&1; then
        # Remove docs cleanup cron jobs
        crontab -l 2>/dev/null | grep -v "docs_cleanup\|cleanup-scheduler.sh" | crontab -
        log "✅ Cleanup schedule removed"
    else
        warn "Cron not available"
    fi
}

# Show cleanup status
show_status() {
    log "📋 Documentation Cleanup Status"
    echo ""
    
    # Check if cleanup system is installed
    if [ -f "$SCRIPTS_DIR/doc-cleaner.cjs" ]; then
        info "✅ Cleanup system installed"
    else
        warn "❌ Cleanup system not installed"
    fi
    
    # Check cron jobs
    if command -v crontab >/dev/null 2>&1; then
        cron_count=$(crontab -l 2>/dev/null | grep -c "cleanup-scheduler.sh" || echo "0")
        if [ "$cron_count" -gt 0 ]; then
            info "✅ Scheduled cleanup active ($cron_count jobs)"
        else
            warn "❌ No scheduled cleanup"
        fi
    else
        warn "❌ Cron not available"
    fi
    
    # Show recent cleanup reports
    if [ -f "$DOCS_DIR/auto-generated/cleanup-report.md" ]; then
        last_cleanup=$(stat -c %Y "$DOCS_DIR/auto-generated/cleanup-report.md" 2>/dev/null || echo "0")
        current_time=$(date +%s)
        age_days=$(( (current_time - last_cleanup) / 86400 ))
        
        if [ "$age_days" -eq 0 ]; then
            info "✅ Last cleanup: Today"
        elif [ "$age_days" -eq 1 ]; then
            info "✅ Last cleanup: Yesterday"
        elif [ "$age_days" -lt 7 ]; then
            info "⚠️ Last cleanup: $age_days days ago"
        else
            warn "❌ Last cleanup: $age_days days ago (stale)"
        fi
    else
        warn "❌ No cleanup reports found"
    fi
    
    # Show current metrics
    if [ -f "$DOCS_DIR/auto-generated/cleanup-metrics.md" ]; then
        echo ""
        info "📊 Current metrics:"
        grep "Total Docs" "$DOCS_DIR/auto-generated/cleanup-metrics.md" | head -1
        grep "Essential Docs" "$DOCS_DIR/auto-generated/cleanup-metrics.md" | head -1
        grep "Archived" "$DOCS_DIR/auto-generated/cleanup-metrics.md" | head -1
    fi
}

# Main command handler
case "$1" in
    "full")
        check_node
        run_full_cleanup
        ;;
    "quick")
        check_node
        run_quick_cleanup
        ;;
    "duplicates")
        check_node
        run_duplicate_scan
        ;;
    "orphans")
        check_node
        run_orphan_cleanup
        ;;
    "temp")
        clean_temp_files
        ;;
    "archive")
        archive_old_files
        ;;
    "metrics")
        generate_metrics
        ;;
    "install")
        install_cron_jobs
        ;;
    "uninstall")
        remove_cron_jobs
        ;;
    "status")
        show_status
        ;;
    *)
        echo "🧹 Documentation Cleanup Scheduler"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  full       - Run full cleanup (duplicates, orphans, optimization)"
        echo "  quick      - Quick cleanup (temp files only)"
        echo "  duplicates - Remove duplicate content"
        echo "  orphans    - Clean orphaned files and dead links"
        echo "  temp       - Remove temporary files"
        echo "  archive    - Archive old files"
        echo "  metrics    - Generate cleanup metrics"
        echo "  install    - Install scheduled cleanup (cron)"
        echo "  uninstall  - Remove scheduled cleanup"
        echo "  status     - Show cleanup system status"
        echo ""
        echo "Examples:"
        echo "  $0 full          # Complete cleanup"
        echo "  $0 quick         # Just remove temp files"
        echo "  $0 install       # Setup automatic cleanup"
        echo "  $0 status        # Check system status"
        ;;
esac
