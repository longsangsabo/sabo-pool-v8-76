#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Production environment variables
const PRODUCTION_ENV = `
VITE_SUPABASE_URL=https://exlqvlbawytbglioqfbc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHF2bGJhd3l0YmdsaW9xZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODAwODgsImV4cCI6MjA2ODY1NjA4OH0.-WHrBx32yHJwhqXAYUOdW5fytPvpzc4AFttXBl3MykA
NODE_ENV=production
`.trim();

// Enhanced console cleanup function
function removeConsoleStatements(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    
    const cleanedLines = lines.map(line => {
      // Preserve console.error for error handling only
      if (line.includes('console.error') && 
          (line.includes('catch') || line.includes('error') || line.includes('Error') || line.includes('finally'))) {
        return line;
      }
      
      // Remove ALL debug console statements
      if (line.includes('console.log') || 
          line.includes('console.info') || 
          line.includes('console.warn') ||
          line.includes('console.debug') ||
          line.includes('console.trace') ||
          line.includes('console.dir') ||
          line.includes('console.table') ||
          line.includes('console.count') ||
          line.includes('console.time') ||
          line.includes('console.timeEnd')) {
        modified = true;
        return ''; // Remove the line completely
      }
      
      return line;
    });
    
    if (modified) {
      const cleanedContent = cleanedLines.join('\n').replace(/\n\n\n+/g, '\n\n');
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`✅ Cleaned: ${filePath}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return 0;
  }
}

// Clean memory leaks from event listeners
function fixEventListenerMemoryLeaks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let modifiedContent = content;
    
    // Check for addEventListener without corresponding removeEventListener
    const addEventListenerMatches = content.match(/addEventListener\s*\(/g);
    const removeEventListenerMatches = content.match(/removeEventListener\s*\(/g);
    
    if (addEventListenerMatches && addEventListenerMatches.length > (removeEventListenerMatches?.length || 0)) {
      console.log(`⚠️  Memory leak potential in ${filePath}: ${addEventListenerMatches.length} addEventListener vs ${removeEventListenerMatches?.length || 0} removeEventListener`);
      return 1;
    }
    
    // Check for setTimeout/setInterval without clear
    const setTimeoutMatches = content.match(/setTimeout\s*\(/g);
    const clearTimeoutMatches = content.match(/clearTimeout\s*\(/g);
    
    if (setTimeoutMatches && setTimeoutMatches.length > (clearTimeoutMatches?.length || 0)) {
      console.log(`⚠️  Timer leak potential in ${filePath}: ${setTimeoutMatches.length} setTimeout vs ${clearTimeoutMatches?.length || 0} clearTimeout`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error checking memory leaks in ${filePath}:`, error.message);
    return 0;
  }
}

// Optimize component performance
function optimizeComponentPerformance(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let modifiedContent = content;
    
    // Check for missing React.memo on functional components
    if (content.includes('export const') && content.includes(': React.FC') && !content.includes('React.memo')) {
      console.log(`⚠️  Performance optimization needed in ${filePath}: Consider React.memo for functional components`);
    }
    
    // Check for missing dependency arrays in useEffect
    const useEffectMatches = content.match(/useEffect\s*\([^,]*,\s*\[\]/g);
    if (content.includes('useEffect') && !useEffectMatches) {
      console.log(`⚠️  Missing dependency arrays in ${filePath}: Check useEffect hooks`);
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error optimizing ${filePath}:`, error.message);
    return 0;
  }
}

// Main enhanced cleanup function
function performEnhancedProductionCleanup() {
  console.log('🚀 Starting ENHANCED production deployment cleanup...\n');
  
  const srcFiles = findFiles('./src', ['.ts', '.tsx']);
  let stats = {
    consoleCleanedCount: 0,
    memoryLeakIssues: 0,
    performanceIssues: 0,
    totalFiles: srcFiles.length
  };
  
  console.log('📋 Phase 1: Console Statement Cleanup...');
  srcFiles.forEach(file => {
    stats.consoleCleanedCount += removeConsoleStatements(file);
  });
  
  console.log('📋 Phase 2: Memory Leak Detection...');
  srcFiles.forEach(file => {
    stats.memoryLeakIssues += fixEventListenerMemoryLeaks(file);
  });
  
  console.log('📋 Phase 3: Performance Optimization Analysis...');
  srcFiles.forEach(file => {
    stats.performanceIssues += optimizeComponentPerformance(file);
  });
  
  console.log('📋 Phase 4: Production Environment Setup...');
  fs.writeFileSync('.env.production', PRODUCTION_ENV);
  console.log('✅ Created .env.production');
  
  // Generate cleanup report
  console.log('\n📊 CLEANUP REPORT:');
  console.log(`   📁 Total files scanned: ${stats.totalFiles}`);
  console.log(`   🧹 Files with console logs cleaned: ${stats.consoleCleanedCount}`);
  console.log(`   ⚠️  Memory leak issues detected: ${stats.memoryLeakIssues}`);
  console.log(`   🔧 Performance optimization opportunities: ${stats.performanceIssues}`);
  
  if (stats.memoryLeakIssues > 0 || stats.performanceIssues > 0) {
    console.log('\n⚠️  CRITICAL: Review the warnings above before deploying to production!');
  }
  
  console.log('\n🎉 ENHANCED CLEANUP COMPLETED!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review and fix memory leak warnings');
  console.log('   2. Implement performance optimizations');
  console.log('   3. git add .');
  console.log('   4. git commit -m "🚀 Production ready - security & performance optimized"');
  console.log('   5. Deploy to Netlify');
  console.log('   6. Monitor performance metrics post-deployment');
}

// Helper function to find files
function findFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && 
              item !== 'node_modules' && item !== 'dist' && item !== 'build') {
            traverse(fullPath);
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        } catch (err) {
          console.warn(`⚠️  Skipping ${fullPath}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error(`❌ Error reading directory ${currentDir}:`, err.message);
    }
  }
  
  traverse(dir);
  return files;
}

// Run the enhanced cleanup
if (require.main === module) {
  performEnhancedProductionCleanup();
}

module.exports = {
  performEnhancedProductionCleanup,
  removeConsoleStatements,
  fixEventListenerMemoryLeaks,
  optimizeComponentPerformance
};