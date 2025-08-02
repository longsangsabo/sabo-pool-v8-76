#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Production environment variables
const PRODUCTION_ENV = `
VITE_SUPABASE_URL=https://exlqvlbawytbglioqfbc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4bHF2bGJhd3l0YmdsaW9xZmJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwODAwODgsImV4cCI6MjA2ODY1NjA4OH0.-WHrBx32yHJwhqXAYUOdW5fytPvpzc4AFttXBl3MykA
NODE_ENV=production
`.trim();

// Clean console statements
function removeConsoleStatements(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    
    const cleanedLines = lines.map(line => {
      // Preserve console.error in catch blocks and error handling
      if (line.includes('console.error') && 
          (line.includes('catch') || line.includes('error') || line.includes('Error'))) {
        return line;
      }
      
      // Remove debug console statements
      if (line.includes('console.log') || 
          line.includes('console.info') || 
          line.includes('console.warn') ||
          line.includes('console.debug') ||
          line.includes('console.trace')) {
        modified = true;
        return ''; // Remove the line
      }
      
      return line;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, cleanedLines.join('\n'));
      console.log(`✅ Cleaned: ${filePath}`);
      return 1;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return 0;
  }
}

// Main cleanup function
function performProductionCleanup() {
  console.log('🚀 Starting production deployment cleanup...\n');
  
  // 1. Clean console statements
  console.log('📋 Step 1: Cleaning console statements...');
  const srcFiles = findFiles('./src', ['.ts', '.tsx']);
  let cleanedCount = 0;
  
  srcFiles.forEach(file => {
    cleanedCount += removeConsoleStatements(file);
  });
  
  console.log(`✅ Cleaned ${cleanedCount} files\n`);
  
  // 2. Create production .env
  console.log('📋 Step 2: Creating production environment file...');
  fs.writeFileSync('.env.production', PRODUCTION_ENV);
  console.log('✅ Created .env.production\n');
  
  // 3. Optimize package.json scripts
  console.log('📋 Step 3: Production ready!\n');
  
  console.log('🎉 DEPLOYMENT READY!');
  console.log('📝 Next steps:');
  console.log('   1. git add .');
  console.log('   2. git commit -m "🚀 Production ready - cleaned console logs"');
  console.log('   3. Deploy to Netlify');
  console.log('   4. Configure environment variables in Netlify dashboard');
}

// Helper function to find files
function findFiles(dir, extensions) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Run the cleanup
performProductionCleanup();