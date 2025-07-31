#!/usr/bin/env node

/**
 * Development Workflow Script
 * Tích hợp vào development process để tự động check relationships
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: 'src',
  includeExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next'
  ],
  fixMode: process.argv.includes('--fix'),
  previewMode: process.argv.includes('--preview'),
  verbose: process.argv.includes('--verbose')
};

/**
 * Scan all relevant files in project
 */
function scanProjectFiles() {
  const files = [];
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir);
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip excluded directories
        if (!CONFIG.excludePatterns.some(pattern => fullPath.includes(pattern))) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // Include relevant file extensions
        if (CONFIG.includeExtensions.some(ext => fullPath.endsWith(ext))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          files.push({
            path: fullPath,
            content
          });
        }
      }
    });
  }
  
  scanDirectory(CONFIG.srcDir);
  return files;
}

/**
 * Check for relationship issues
 */
function checkRelationships(files) {
  const issues = [];
  
  const problematicPatterns = [
    {
      pattern: /profiles!challenges_\w+_fkey/g,
      message: 'Deprecated foreign key format',
      severity: 'error'
    },
    {
      pattern: /user_profiles!/g,
      message: 'Incorrect table reference (should be profiles!)',
      severity: 'error'  
    },
    {
      pattern: /clubs!/g,
      message: 'Deprecated table reference (should be club_profiles!)',
      severity: 'warning'
    }
  ];
  
  files.forEach(file => {
    const lines = file.content.split('\n');
    
    problematicPatterns.forEach(({ pattern, message, severity }) => {
      let match;
      const globalPattern = new RegExp(pattern.source, pattern.flags);
      
      while ((match = globalPattern.exec(file.content)) !== null) {
        const beforeMatch = file.content.substring(0, match.index);
        const lineNumber = beforeMatch.split('\n').length;
        
        issues.push({
          file: file.path,
          line: lineNumber,
          message,
          severity,
          match: match[0]
        });
      }
    });
  });
  
  return issues;
}

/**
 * Auto-fix relationship issues
 */
function autoFixRelationships(files) {
  const fixes = [];
  
  const fixPatterns = [
    {
      pattern: /profiles!challenges_challenger_id_fkey/g,
      replacement: 'profiles!challenger_id',
      description: 'Fixed challenger relationship'
    },
    {
      pattern: /profiles!challenges_opponent_id_fkey/g,
      replacement: 'profiles!opponent_id',
      description: 'Fixed opponent relationship'
    },
    {
      pattern: /user_profiles!/g,
      replacement: 'profiles!',
      description: 'Fixed table reference'
    },
    {
      pattern: /clubs!/g,
      replacement: 'club_profiles!',
      description: 'Fixed club table reference'
    }
  ];
  
  files.forEach(file => {
    let content = file.content;
    let changed = false;
    const appliedFixes = [];
    
    fixPatterns.forEach(({ pattern, replacement, description }) => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        content = content.replace(pattern, replacement);
        changed = true;
        appliedFixes.push(`${description} (${matches.length} occurrences)`);
      }
    });
    
    if (changed) {
      fixes.push({
        file: file.path,
        appliedFixes,
        newContent: content
      });
    }
  });
  
  return fixes;
}

/**
 * Apply fixes to files
 */
function applyFixes(fixes) {
  fixes.forEach(fix => {
    fs.writeFileSync(fix.file, fix.newContent, 'utf8');
    console.log(`✅ Fixed ${fix.file}`);
    
    if (CONFIG.verbose) {
      fix.appliedFixes.forEach(desc => {
        console.log(`   - ${desc}`);
      });
    }
  });
}

/**
 * Generate report
 */
function generateReport(issues, fixes = []) {
  console.log('\n=== RELATIONSHIP CHECK REPORT ===\n');
  
  if (issues.length === 0) {
    console.log('✅ No relationship issues found!');
    return;
  }
  
  // Group issues by severity
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  console.log(`📊 Summary:`);
  console.log(`   Errors: ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Total: ${issues.length}\n`);
  
  if (CONFIG.fixMode && fixes.length > 0) {
    console.log(`🔧 Applied Fixes: ${fixes.length} files\n`);
  }
  
  // Show issues by file
  const fileGroups = {};
  issues.forEach(issue => {
    if (!fileGroups[issue.file]) {
      fileGroups[issue.file] = [];
    }
    fileGroups[issue.file].push(issue);
  });
  
  Object.entries(fileGroups).forEach(([file, fileIssues]) => {
    console.log(`📁 ${file}`);
    
    fileIssues.forEach(issue => {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`   ${icon} Line ${issue.line}: ${issue.message}`);
      console.log(`      Found: ${issue.match}`);
    });
    
    console.log('');
  });
  
  // Exit with error code if there are unfixed errors
  if (errors.length > 0 && !CONFIG.fixMode) {
    console.log('💡 Run with --fix to automatically fix these issues\n');
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning project for relationship issues...\n');
  
  try {
    const files = scanProjectFiles();
    console.log(`📂 Scanned ${files.length} files\n`);
    
    const issues = checkRelationships(files);
    
    if (CONFIG.fixMode && issues.length > 0) {
      console.log('🔧 Applying auto-fixes...\n');
      const fixes = autoFixRelationships(files);
      applyFixes(fixes);
      
      // Re-check after fixes
      const updatedFiles = scanProjectFiles();
      const remainingIssues = checkRelationships(updatedFiles);
      generateReport(remainingIssues, fixes);
      
    } else if (CONFIG.previewMode) {
      const fixes = autoFixRelationships(files);
      console.log('🔍 Preview of potential fixes:\n');
      
      fixes.forEach(fix => {
        console.log(`📁 ${fix.file}`);
        fix.appliedFixes.forEach(desc => {
          console.log(`   ✅ ${desc}`);
        });
        console.log('');
      });
      
      console.log(`💡 Run with --fix to apply these ${fixes.length} fixes\n`);
      
    } else {
      generateReport(issues);
    }
    
  } catch (error) {
    console.error('❌ Error during relationship check:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}