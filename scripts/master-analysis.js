#!/usr/bin/env node

/**
 * Master Automation Script
 * 
 * This script runs all the analysis tools in sequence and 
 * generates a consolidated report with findings and action items.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR);
}

// List of analysis scripts to run
const analysisScripts = [
  'find-dead-tournament-components.js',
  'consolidate-tournament-cards.js',
  'cleanup-dependencies.js',
  'standardize-enums.js',
  'analyze-component-structure.js'
];

console.log('🚀 Starting comprehensive code analysis...\n');

// Function to run a single analysis script
async function runScript(scriptName) {
  const scriptPath = path.join(SCRIPTS_DIR, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script not found: ${scriptPath}`);
    return null;
  }
  
  console.log(`Running ${scriptName}...`);
  
  try {
    // Make script executable
    execSync(`chmod +x ${scriptPath}`);
    
    // Run the script
    const { stdout, stderr } = await exec(`node ${scriptPath}`);
    
    if (stderr) {
      console.warn(`⚠️ ${scriptName} produced warnings:`, stderr);
    }
    
    return stdout;
  } catch (error) {
    console.error(`❌ Error running ${scriptName}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return null;
  }
}

// Function to read report files
function collectReportFiles() {
  const reports = {};
  
  // Standard report files
  const reportFiles = [
    'tournament-component-usage-report.md',
    'tournament-card-consolidation-plan.md',
    'dependency-cleanup-report.md',
    'enum-standardization-report.md',
    'component-structure-report.md'
  ];
  
  reportFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      reports[file] = fs.readFileSync(filePath, 'utf8');
      
      // Move file to reports directory
      const newPath = path.join(REPORTS_DIR, file);
      fs.renameSync(filePath, newPath);
    }
  });
  
  return reports;
}

// Function to generate consolidated report
function generateConsolidatedReport(reports) {
  let report = `# Comprehensive Code Analysis Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  report += `## Executive Summary\n\n`;
  
  // Count issues by type
  let unusedComponentsCount = 0;
  let redundantCardComponentsCount = 0;
  let unusedDependenciesCount = 0;
  let inconsistentEnumUsageCount = 0;
  let structuralIssuesCount = 0;
  
  if (reports['tournament-component-usage-report.md']) {
    const content = reports['tournament-component-usage-report.md'];
    unusedComponentsCount = (content.match(/\* /g) || []).length;
  }
  
  if (reports['tournament-card-consolidation-plan.md']) {
    const content = reports['tournament-card-consolidation-plan.md'];
    const matches = content.match(/### .+TournamentCard.+\(/g);
    redundantCardComponentsCount = matches ? matches.length : 0;
  }
  
  if (reports['dependency-cleanup-report.md']) {
    const content = reports['dependency-cleanup-report.md'];
    const matches = content.match(/- .+/g);
    unusedDependenciesCount = matches ? matches.length : 0;
  }
  
  if (reports['enum-standardization-report.md']) {
    const content = reports['enum-standardization-report.md'];
    const lines = content.split('\n');
    let count = 0;
    lines.forEach(line => {
      if (line.startsWith('- ') && line.includes('Found in')) {
        const match = line.match(/Found in (\d+) locations/);
        if (match && match[1]) {
          count += parseInt(match[1]);
        }
      }
    });
    inconsistentEnumUsageCount = count;
  }
  
  if (reports['component-structure-report.md']) {
    const content = reports['component-structure-report.md'];
    structuralIssuesCount = (content.match(/- /g) || []).length;
  }
  
  report += `- **Unused Components**: ${unusedComponentsCount}\n`;
  report += `- **Redundant Card Components**: ${redundantCardComponentsCount}\n`;
  report += `- **Unused Dependencies**: ${unusedDependenciesCount}\n`;
  report += `- **Inconsistent Enum Usage**: ${inconsistentEnumUsageCount}\n`;
  report += `- **Structural Improvements**: ${structuralIssuesCount}\n\n`;
  
  // Action plan
  report += `## Action Plan\n\n`;
  report += `Based on the analysis, here are the recommended actions:\n\n`;
  
  if (unusedComponentsCount > 0) {
    report += `### 1. Clean up Unused Components\n\n`;
    report += `Remove ${unusedComponentsCount} unused tournament components. See detailed list in \`reports/tournament-component-usage-report.md\`.\n\n`;
  }
  
  if (redundantCardComponentsCount > 0) {
    report += `### 2. Consolidate Tournament Card Components\n\n`;
    report += `Replace ${redundantCardComponentsCount} redundant tournament card components with the UnifiedTournamentCard. Follow the migration plan in \`reports/tournament-card-consolidation-plan.md\`.\n\n`;
  }
  
  if (unusedDependenciesCount > 0) {
    report += `### 3. Clean up Dependencies\n\n`;
    report += `Remove ${unusedDependenciesCount} unused dependencies. See the dependency cleanup report in \`reports/dependency-cleanup-report.md\` for specific commands.\n\n`;
  }
  
  if (inconsistentEnumUsageCount > 0) {
    report += `### 4. Standardize Enum Usage\n\n`;
    report += `Replace ${inconsistentEnumUsageCount} instances of hardcoded string literals with proper enum values. See \`reports/enum-standardization-report.md\` for details.\n\n`;
  }
  
  if (structuralIssuesCount > 0) {
    report += `### 5. Restructure Component Folders\n\n`;
    report += `Implement the proposed component structure reorganization. See \`reports/component-structure-report.md\` for the suggested structure.\n\n`;
  }
  
  report += `## Next Steps\n\n`;
  report += `1. Review the detailed reports in the \`reports/\` directory\n`;
  report += `2. Prioritize cleanup tasks based on impact and difficulty\n`;
  report += `3. Implement changes systematically, starting with component consolidation\n`;
  report += `4. Re-run analysis after implementing changes to verify improvements\n\n`;
  
  report += `## Report Links\n\n`;
  report += `- [Tournament Component Usage](./reports/tournament-component-usage-report.md)\n`;
  report += `- [Tournament Card Consolidation](./reports/tournament-card-consolidation-plan.md)\n`;
  report += `- [Dependency Cleanup](./reports/dependency-cleanup-report.md)\n`;
  report += `- [Enum Standardization](./reports/enum-standardization-report.md)\n`;
  report += `- [Component Structure](./reports/component-structure-report.md)\n`;
  
  return report;
}

// Main function
async function runAllAnalysis() {
  // Run all analysis scripts
  for (const script of analysisScripts) {
    const result = await runScript(script);
    if (result) {
      console.log(`✅ ${script} completed successfully\n`);
    } else {
      console.log(`⚠️ ${script} may not have completed successfully\n`);
    }
  }
  
  console.log('Collecting reports...');
  const reports = collectReportFiles();
  
  console.log('Generating consolidated report...');
  const consolidatedReport = generateConsolidatedReport(reports);
  
  const consolidatedReportPath = path.join(process.cwd(), 'CODE_ANALYSIS_SUMMARY.md');
  fs.writeFileSync(consolidatedReportPath, consolidatedReport);
  
  console.log(`\n✅ Analysis complete! Consolidated report generated at: ${consolidatedReportPath}`);
}

runAllAnalysis().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
