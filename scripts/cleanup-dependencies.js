#!/usr/bin/env node

/**
 * Dependency Cleanup Utility
 * 
 * This script helps clean up unused dependencies from package.json
 * It runs depcheck to find unused packages and provides instructions
 * for safely removing them.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');

// Ensure depcheck is installed
try {
  execSync('npx depcheck --version', { stdio: 'ignore' });
} catch (error) {
  console.log('Installing depcheck...');
  execSync('npm install -g depcheck', { stdio: 'inherit' });
}

// Parse package.json
function readPackageJson() {
  try {
    const content = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }
}

// Run dependency analysis
function runDepcheck() {
  try {
    const result = execSync('npx depcheck --json', { encoding: 'utf8' });
    return JSON.parse(result);
  } catch (error) {
    try {
      // If depcheck exits with error code but outputs JSON, parse it anyway
      return JSON.parse(error.stdout);
    } catch (parseError) {
      console.error('Error running depcheck:', error.message);
      process.exit(1);
    }
  }
}

// Find dependencies that are actually used but reported as unused
function findFalsePositives(depcheckResult) {
  // Common false positives in React projects
  const commonFalsePositives = [
    'react',
    'react-dom',
    '@types/react',
    '@types/react-dom',
    'typescript',
    'vite',
    '@vitejs/plugin-react',
    '@vitejs/plugin-react-swc',
    'tailwindcss',
    'postcss',
    'autoprefixer'
  ];
  
  return commonFalsePositives.filter(dep => 
    depcheckResult.dependencies.includes(dep) || 
    depcheckResult.devDependencies.includes(dep)
  );
}

// Generate npm commands to remove packages
function generateCleanupCommands(unusedDeps, unusedDevDeps) {
  const commands = [];
  
  if (unusedDeps.length > 0) {
    commands.push(`npm uninstall ${unusedDeps.join(' ')}`);
  }
  
  if (unusedDevDeps.length > 0) {
    commands.push(`npm uninstall --save-dev ${unusedDevDeps.join(' ')}`);
  }
  
  return commands;
}

// Main function
async function cleanupDependencies() {
  console.log('🔍 Analyzing dependencies...');
  
  // Get current dependencies
  const packageJson = readPackageJson();
  const currentDeps = Object.keys(packageJson.dependencies || {});
  const currentDevDeps = Object.keys(packageJson.devDependencies || {});
  
  console.log(`Found ${currentDeps.length} dependencies and ${currentDevDeps.length} dev dependencies`);
  
  // Run depcheck
  const depcheckResult = runDepcheck();
  const unusedDeps = depcheckResult.dependencies || [];
  const unusedDevDeps = depcheckResult.devDependencies || [];
  const missingDeps = Object.keys(depcheckResult.missing || {});
  
  // Filter out false positives
  const falsePositives = findFalsePositives(depcheckResult);
  const filteredUnusedDeps = unusedDeps.filter(dep => !falsePositives.includes(dep));
  const filteredUnusedDevDeps = unusedDevDeps.filter(dep => !falsePositives.includes(dep));
  
  // Generate report
  let report = `# Dependency Cleanup Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  if (filteredUnusedDeps.length > 0 || filteredUnusedDevDeps.length > 0) {
    report += `## Unused Dependencies\n\n`;
    
    if (filteredUnusedDeps.length > 0) {
      report += `### Production Dependencies\n\n`;
      filteredUnusedDeps.forEach(dep => {
        report += `- ${dep}\n`;
      });
      report += '\n';
    }
    
    if (filteredUnusedDevDeps.length > 0) {
      report += `### Development Dependencies\n\n`;
      filteredUnusedDevDeps.forEach(dep => {
        report += `- ${dep}\n`;
      });
      report += '\n';
    }
    
    const commands = generateCleanupCommands(filteredUnusedDeps, filteredUnusedDevDeps);
    
    report += `## Cleanup Commands\n\n`;
    commands.forEach(cmd => {
      report += `\`\`\`bash\n${cmd}\n\`\`\`\n\n`;
    });
  } else {
    report += `✅ No unused dependencies found!\n\n`;
  }
  
  if (missingDeps.length > 0) {
    report += `## Missing Dependencies\n\n`;
    report += 'These dependencies are used in the code but not listed in package.json:\n\n';
    
    Object.entries(depcheckResult.missing).forEach(([dep, files]) => {
      report += `### ${dep}\n\n`;
      report += 'Used in:\n';
      files.forEach(file => {
        report += `- ${file}\n`;
      });
      report += '\n';
    });
    
    report += `### Installation Command\n\n`;
    report += `\`\`\`bash\nnpm install ${missingDeps.join(' ')}\n\`\`\`\n\n`;
  }
  
  // Write report
  const reportPath = path.join(process.cwd(), 'dependency-cleanup-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Dependency cleanup report generated at: ${reportPath}`);
  console.log(`Found ${filteredUnusedDeps.length} unused dependencies and ${filteredUnusedDevDeps.length} unused dev dependencies`);
  
  if (missingDeps.length > 0) {
    console.log(`⚠️ Found ${missingDeps.length} missing dependencies that should be installed`);
  }
}

cleanupDependencies().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
