#!/usr/bin/env node

/**
 * Script to remove console statements from production code
 * Run: node eslint-console-cleanup.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Directories to scan
const SRC_DIRS = ['src/**/*.{ts,tsx,js,jsx}'];
const EXCLUDE_PATTERNS = [
  'src/**/*.test.*',
  'src/**/*.spec.*',
  'src/**/debug.*',
  'src/**/dev.*'
];

// Console methods to remove (keep console.error for error handling)
const CONSOLE_METHODS = [
  'console.log',
  'console.warn', 
  'console.info',
  'console.debug',
  'console.trace'
];

let totalFilesScanned = 0;
let totalFilesModified = 0;
let totalStatementsRemoved = 0;

function shouldKeepConsoleStatement(line) {
  // Keep console.error statements
  if (line.includes('console.error')) {
    return true;
  }
  
  // Keep console statements inside comments
  if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
    return true;
  }
  
  // Keep console statements that are clearly for error handling
  if (line.includes('catch') || line.includes('error') || line.includes('Error')) {
    return true;
  }
  
  return false;
}

function cleanConsoleFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    let removedCount = 0;
    
    const cleanedLines = lines.map(line => {
      // Check if line contains any console method we want to remove
      const hasConsoleStatement = CONSOLE_METHODS.some(method => 
        line.includes(method) && !shouldKeepConsoleStatement(line)
      );
      
      if (hasConsoleStatement) {
        modified = true;
        removedCount++;
        
        // If it's a standalone console statement, remove the entire line
        const trimmed = line.trim();
        if (trimmed.startsWith('console.') && trimmed.endsWith(';')) {
          return ''; // Remove entire line
        }
        
        // If console statement is part of a larger expression, comment it out
        return line.replace(/console\.(log|warn|info|debug|trace)\([^;]*\);?/g, '');
      }
      
      return line;
    });
    
    if (modified) {
      // Remove empty lines that were console statements
      const finalContent = cleanedLines
        .filter((line, index) => {
          if (line === '' && index > 0 && index < cleanedLines.length - 1) {
            const prevLine = cleanedLines[index - 1];
            const nextLine = cleanedLines[index + 1];
            // Remove empty line if it was between non-empty lines and likely a console statement
            return !(prevLine.trim() && nextLine.trim());
          }
          return true;
        })
        .join('\n');
        
      fs.writeFileSync(filePath, finalContent, 'utf8');
      totalFilesModified++;
      totalStatementsRemoved += removedCount;
      console.log(`✅ Cleaned ${removedCount} console statements from: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Starting console statement cleanup...\n');
  
  // Get all files to process
  const allFiles = [];
  SRC_DIRS.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: EXCLUDE_PATTERNS
    });
    allFiles.push(...files);
  });
  
  // Remove duplicates
  const uniqueFiles = [...new Set(allFiles)];
  totalFilesScanned = uniqueFiles.length;
  
  console.log(`📂 Found ${totalFilesScanned} files to scan\n`);
  
  // Process each file
  uniqueFiles.forEach(filePath => {
    cleanConsoleFromFile(filePath);
  });
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`📁 Files scanned: ${totalFilesScanned}`);
  console.log(`📝 Files modified: ${totalFilesModified}`);
  console.log(`🗑️  Console statements removed: ${totalStatementsRemoved}`);
  
  if (totalStatementsRemoved > 0) {
    console.log('\n✨ Console cleanup completed successfully!');
  } else {
    console.log('\n✅ No console statements found to remove.');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { cleanConsoleFromFile, shouldKeepConsoleStatement };
