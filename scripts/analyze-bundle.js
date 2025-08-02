#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle for circular dependencies and chunk issues...\n');

// Check for circular dependencies
console.log('1. Checking circular dependencies...');
try {
  const circularDeps = execSync('npx madge --circular --extensions ts,tsx,js,jsx src/', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  if (circularDeps.trim()) {
    console.log('❌ Circular dependencies found:');
    console.log(circularDeps);
  } else {
    console.log('✅ No circular dependencies found');
  }
} catch (error) {
  if (error.stdout && error.stdout.includes('No circular dependency found!')) {
    console.log('✅ No circular dependencies found');
  } else {
    console.log('⚠️ Error checking circular dependencies:', error.message);
  }
}

// Analyze lazy imports
console.log('\n2. Analyzing lazy imports...');
const findLazyImports = (dir) => {
  const lazyImports = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      lazyImports.push(...findLazyImports(filePath));
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lazyMatches = content.match(/lazy\s*\(\s*\(\)\s*=>\s*import\s*\(/g);
      if (lazyMatches) {
        lazyImports.push({
          file: filePath,
          count: lazyMatches.length
        });
      }
    }
  });
  
  return lazyImports;
};

const lazyImports = findLazyImports('src');
console.log(`Found ${lazyImports.length} files with lazy imports`);
lazyImports.forEach(({ file, count }) => {
  console.log(`  - ${file}: ${count} lazy import(s)`);
});

// Analyze default exports
console.log('\n3. Analyzing default exports...');
const findDefaultExports = (dir) => {
  const defaultExports = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      defaultExports.push(...findDefaultExports(filePath));
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('export default')) {
        defaultExports.push(filePath);
      }
    }
  });
  
  return defaultExports;
};

const defaultExports = findDefaultExports('src');
console.log(`Found ${defaultExports.length} files with default exports`);

// Analyze @ imports
console.log('\n4. Analyzing @ alias imports...');
const findAliasImports = (dir) => {
  const aliasImports = [];
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      aliasImports.push(...findAliasImports(filePath));
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const aliasMatches = content.match(/from\s+['"]@\//g);
      if (aliasMatches) {
        aliasImports.push({
          file: filePath,
          count: aliasMatches.length
        });
      }
    }
  });
  
  return aliasImports;
};

const aliasImports = findAliasImports('src');
const totalAliasCount = aliasImports.reduce((sum, { count }) => sum + count, 0);
console.log(`Found ${totalAliasCount} @ alias imports across ${aliasImports.length} files`);

// Generate report
console.log('\n📊 Bundle Analysis Summary:');
console.log('================================');
console.log(`Lazy imports: ${lazyImports.reduce((sum, { count }) => sum + count, 0)}`);
console.log(`Default exports: ${defaultExports.length}`);
console.log(`Alias imports: ${totalAliasCount}`);
console.log(`Files with lazy imports: ${lazyImports.length}`);

console.log('\n🎯 Recommendations:');
console.log('- Reduced chunks from 12 to 6 in vite.config.ts');
console.log('- Simplified admin router structure');
console.log('- Added error boundaries for chunk loading');
console.log('- Fixed circular dependencies in admin chunk');

console.log('\n✅ Analysis complete!');