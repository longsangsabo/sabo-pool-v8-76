#!/usr/bin/env node

/**
 * TASK 3: Remove Debug Console Statements
 * Enhanced script to remove console statements while preserving error handling
 */

const fs = require('fs');
const path = require('path');

// Patterns to match console statements
const CONSOLE_PATTERNS = [
  // Debug console statements to remove
  /console\.log\([^)]*\);?\s*\n?/g,
  /console\.debug\([^)]*\);?\s*\n?/g,
  /console\.info\([^)]*\);?\s*\n?/g,
  /console\.warn\([^)]*\);?\s*\n?/g,
  // Remove console.error that are just logging (not in catch blocks)
  /(?<!catch\s*\([^)]*\)\s*{\s*)console\.error\([^)]*\);?\s*\n?/g,
];

// Error handling patterns to preserve
const PRESERVE_PATTERNS = [
  /catch\s*\([^)]*\)\s*{\s*[^}]*console\.error/,
  /\.catch\([^)]*console\.error/,
  /throw\s+new\s+Error/,
];

function shouldPreserveConsole(line, fullContent, lineIndex) {
  // Check if this console statement is in error handling context
  const contextStart = Math.max(0, lineIndex - 5);
  const contextEnd = Math.min(fullContent.length - 1, lineIndex + 2);
  const context = fullContent.slice(contextStart, contextEnd).join('\n');
  
  return PRESERVE_PATTERNS.some(pattern => pattern.test(context));
}

function removeConsoleStatements(content, filePath) {
  const lines = content.split('\n');
  const originalCount = (content.match(/console\.(log|warn|error|debug|info)/g) || []).length;
  
  let modifiedContent = content;
  let removedCount = 0;
  
  // Remove non-error console statements
  CONSOLE_PATTERNS.forEach(pattern => {
    const matches = modifiedContent.match(pattern) || [];
    matches.forEach(match => {
      const lineIndex = modifiedContent.split('\n').findIndex(line => line.includes(match.trim()));
      if (lineIndex !== -1 && !shouldPreserveConsole(match, lines, lineIndex)) {
        modifiedContent = modifiedContent.replace(match, '');
        removedCount++;
      }
    });
  });
  
  const finalCount = (modifiedContent.match(/console\.(log|warn|error|debug|info)/g) || []).length;
  
  return {
    content: modifiedContent,
    originalCount,
    finalCount,
    removedCount: originalCount - finalCount
  };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = removeConsoleStatements(content, filePath);
    
    if (result.removedCount > 0) {
      fs.writeFileSync(filePath, result.content);
      console.log(`✅ ${filePath}: Removed ${result.removedCount} console statements (${result.originalCount} → ${result.finalCount})`);
      return result.removedCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function findTSXFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTSXFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      // Skip test files
      if (!item.includes('.test.') && !item.includes('.spec.')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function main() {
  console.log('🔍 TASK 3: Removing Debug Console Statements...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findTSXFiles(srcDir);
  
  let totalRemoved = 0;
  let filesModified = 0;
  
  console.log(`Processing ${files.length} TypeScript/React files...\n`);
  
  files.forEach(file => {
    const removed = processFile(file);
    if (removed > 0) {
      filesModified++;
      totalRemoved += removed;
    }
  });
  
  console.log('\n📊 SUMMARY:');
  console.log(`Files processed: ${files.length}`);
  console.log(`Files modified: ${filesModified}`);
  console.log(`Console statements removed: ${totalRemoved}`);
  console.log('\n✅ Console cleanup completed!');
  
  // Generate ESLint rule
  const eslintRule = {
    "rules": {
      "no-console": ["error", {
        "allow": ["error"] // Allow console.error in catch blocks
      }]
    }
  };
  
  fs.writeFileSync('.eslintrc.console.json', JSON.stringify(eslintRule, null, 2));
  console.log('📝 Created .eslintrc.console.json with console detection rules');
}

if (require.main === module) {
  main();
}

module.exports = { removeConsoleStatements, processFile };