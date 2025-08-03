#!/usr/bin/env node

/**
 * Tournament Component Usage Analyzer
 * This script identifies potentially unused tournament components by:
 * 1. Finding all tournament component files
 * 2. Scanning the codebase for imports of each component
 * 3. Reporting components that aren't imported or used elsewhere
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOURNAMENT_COMPONENTS_DIR = path.join(process.cwd(), 'src', 'components', 'tournament');
const SRC_DIR = path.join(process.cwd(), 'src');

console.log('🔎 Analyzing tournament components for potential dead code...');

// Function to get all tournament component files
function getTournamentComponentFiles() {
  const componentFiles = [];
  
  function scanDir(directory) {
    const items = fs.readdirSync(directory);
    
    items.forEach(item => {
      const itemPath = path.join(directory, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        scanDir(itemPath);
      } else if (stats.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        // Skip index files as they're typically just re-exports
        if (item === 'index.ts' || item === 'index.tsx') return;
        
        componentFiles.push({
          path: itemPath,
          name: item,
          relativePath: path.relative(TOURNAMENT_COMPONENTS_DIR, itemPath)
        });
      }
    });
  }
  
  scanDir(TOURNAMENT_COMPONENTS_DIR);
  return componentFiles;
}

// Function to check if a component is used elsewhere in the codebase
function findComponentUsage(componentName, componentFilePath) {
  try {
    // Get the component name without extension
    const nameWithoutExt = componentName.replace(/\.(tsx|ts)$/, '');
    
    // Find imports of this component
    const grepCommand = `grep -r --include="*.{ts,tsx}" "${nameWithoutExt}" ${SRC_DIR} | grep -v "${componentFilePath}"`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    
    // If we find any imports, the component is used
    return {
      isUsed: result.trim().length > 0,
      usageCount: result.trim().split('\n').filter(Boolean).length,
      imports: result.trim().split('\n').filter(Boolean)
    };
  } catch (error) {
    // If grep returns non-zero (i.e., no matches), component is unused
    return { isUsed: false, usageCount: 0, imports: [] };
  }
}

// Main function
function analyzeComponents() {
  const componentFiles = getTournamentComponentFiles();
  console.log(`📊 Found ${componentFiles.length} tournament components to analyze.`);
  
  const unusedComponents = [];
  const lowUsageComponents = [];
  
  componentFiles.forEach(component => {
    const usage = findComponentUsage(component.name, component.path);
    
    if (!usage.isUsed) {
      unusedComponents.push({
        name: component.name,
        path: component.relativePath
      });
    } else if (usage.usageCount <= 2) {
      lowUsageComponents.push({
        name: component.name,
        path: component.relativePath,
        usageCount: usage.usageCount,
        imports: usage.imports
      });
    }
  });
  
  // Output results
  console.log('\n📝 ANALYSIS RESULTS:');
  
  if (unusedComponents.length > 0) {
    console.log('\n❌ POTENTIALLY UNUSED COMPONENTS:');
    console.log('These components appear to have no imports elsewhere in the codebase:');
    unusedComponents.forEach(comp => {
      console.log(`  - ${comp.name} (${comp.path})`);
    });
  } else {
    console.log('\n✅ No completely unused components found!');
  }
  
  if (lowUsageComponents.length > 0) {
    console.log('\n⚠️ LOW-USAGE COMPONENTS:');
    console.log('These components have very few imports and might be candidates for consolidation:');
    lowUsageComponents.forEach(comp => {
      console.log(`  - ${comp.name} (${comp.path}) - ${comp.usageCount} usage(s):`);
      comp.imports.forEach(imp => {
        console.log(`    * ${imp}`);
      });
    });
  }
  
  // Write to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportContent = `# Tournament Component Usage Report (${timestamp})

## Potentially Unused Components
${unusedComponents.length === 0 ? 'No unused components found!' : unusedComponents.map(comp => `* ${comp.name} (${comp.path})`).join('\n')}

## Low Usage Components (2 or fewer imports)
${lowUsageComponents.length === 0 ? 'No low-usage components found!' : lowUsageComponents.map(comp => {
  return `### ${comp.name} (${comp.path}) - ${comp.usageCount} usage(s):
${comp.imports.map(imp => `* ${imp}`).join('\n')}`;
}).join('\n\n')}
`;

  fs.writeFileSync(path.join(process.cwd(), 'tournament-component-usage-report.md'), reportContent);
  
  console.log('\n📄 Report saved to tournament-component-usage-report.md');
  console.log('\n✨ Analysis complete!');
  
  // Return the data for potential further processing
  return { unusedComponents, lowUsageComponents };
}

analyzeComponents();
