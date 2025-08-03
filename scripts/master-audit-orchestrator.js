#!/usr/bin/env node

/**
 * Master Audit Orchestrator
 * 
 * This script orchestrates the execution of all the analysis scripts
 * and generates a comprehensive report with findings and recommendations.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths to analysis scripts and their reports
const scripts = [
  { name: 'Component Consolidation', script: './scripts/simple-component-consolidation.js', report: 'tournament-card-consolidation-report.md' },
  { name: 'Dependency Analysis', script: './scripts/simple-dependency-analyzer.js', report: 'dependency-analysis-report.md' },
  { name: 'Performance Analysis', script: './scripts/simple-performance-analyzer.js', report: 'performance-analysis-report.md' },
  { name: 'Security Analysis', script: './scripts/simple-security-analyzer.js', report: 'security-analysis-report.md' },
  { name: 'Test Coverage', script: './scripts/simple-test-analyzer.js', report: 'test-coverage-report.md' }
];

// Define path for master report
const MASTER_REPORT_PATH = path.join(process.cwd(), 'COMPREHENSIVE_AUDIT_REPORT.md');
const BACKUP_DIR = path.join(process.cwd(), 'audit-reports-backup');

// Function to ensure a script is executable
function makeExecutable(scriptPath) {
  try {
    execSync(`chmod +x ${scriptPath}`);
    return true;
  } catch (error) {
    console.error(`Error making ${scriptPath} executable:`, error.message);
    return false;
  }
}

// Function to run a script and handle errors
function runScript(scriptPath) {
  console.log(`\n🚀 Running ${path.basename(scriptPath)}...`);
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error running ${scriptPath}:`, error.message);
    return false;
  }
}

// Function to read a report file if it exists
function readReportIfExists(reportPath) {
  try {
    if (fs.existsSync(reportPath)) {
      return fs.readFileSync(reportPath, 'utf8');
    }
  } catch (error) {
    console.error(`Error reading report ${reportPath}:`, error.message);
  }
  return null;
}

// Function to extract key findings from report content
function extractKeyFindings(reportContent, scriptName) {
  if (!reportContent) return 'No data available';
  
  let findings = '';
  
  // Extract overview section which typically contains key metrics
  const overviewMatch = reportContent.match(/## Overview\n\n([\s\S]*?)(?=\n##|$)/);
  if (overviewMatch && overviewMatch[1]) {
    findings += overviewMatch[1].trim() + '\n\n';
  }
  
  // Extract specific sections based on script type
  switch (scriptName) {
    case 'Component Consolidation':
      // Get number of components to consolidate
      const componentMatch = reportContent.match(/Found (\d+) tournament card components/);
      if (componentMatch && componentMatch[1]) {
        findings += `- ${componentMatch[1]} tournament card components can be consolidated\n`;
      }
      break;
      
    case 'Dependency Analysis':
      // Extract unused and vulnerable dependencies
      const unusedMatch = reportContent.match(/Unused dependencies: (\d+)/);
      const vulnMatch = reportContent.match(/Security vulnerabilities: (\d+)/);
      
      if (unusedMatch && unusedMatch[1]) {
        findings += `- ${unusedMatch[1]} unused dependencies identified\n`;
      }
      
      if (vulnMatch && vulnMatch[1]) {
        findings += `- ${vulnMatch[1]} security vulnerabilities in dependencies\n`;
      }
      break;
      
    case 'Performance Analysis':
      // Extract performance issue counts
      const issuesMatch = reportContent.match(/Found (\d+) potential performance issues/);
      if (issuesMatch && issuesMatch[1]) {
        findings += `- ${issuesMatch[1]} potential performance issues identified\n`;
      }
      break;
      
    case 'Security Analysis':
      // Extract security issue counts by severity
      const highMatch = reportContent.match(/High severity issues: (\d+)/);
      const mediumMatch = reportContent.match(/Medium severity issues: (\d+)/);
      
      if (highMatch && highMatch[1]) {
        findings += `- ${highMatch[1]} high severity security issues\n`;
      }
      
      if (mediumMatch && mediumMatch[1]) {
        findings += `- ${mediumMatch[1]} medium severity security issues\n`;
      }
      break;
      
    case 'Test Coverage':
      // Extract test coverage rate
      const coverageMatch = reportContent.match(/Test coverage rate: ([\d\.]+)%/);
      if (coverageMatch && coverageMatch[1]) {
        findings += `- Current test coverage rate: ${coverageMatch[1]}%\n`;
      }
      break;
  }
  
  return findings.trim() || 'No key findings extracted';
}

// Function to create backup of reports
function backupReports() {
  console.log('\n📦 Creating backup of all reports...');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Backup each report
  scripts.forEach(script => {
    const reportPath = path.join(process.cwd(), script.report);
    if (fs.existsSync(reportPath)) {
      const backupPath = path.join(BACKUP_DIR, `${timestamp}-${script.report}`);
      fs.copyFileSync(reportPath, backupPath);
    }
  });
  
  console.log(`✅ Reports backed up to ${BACKUP_DIR}`);
}

// Function to generate master report
function generateMasterReport(results) {
  let report = `# Comprehensive Audit Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  report += `## Executive Summary\n\n`;
  report += `This report provides a comprehensive analysis of the codebase, covering component structure, dependencies, performance, security, and test coverage.\n\n`;
  
  report += `## Key Findings\n\n`;
  
  // Add status for each script
  let successCount = 0;
  results.forEach(result => {
    if (result.success) successCount++;
  });
  
  report += `- ${successCount}/${results.length} analysis scripts completed successfully\n`;
  
  // Add key findings from each report
  results.forEach(result => {
    if (result.findings && result.findings !== 'No data available' && result.findings !== 'No key findings extracted') {
      report += `\n### ${result.name} Findings\n\n${result.findings}\n`;
    }
  });
  
  report += `\n## Detailed Analysis\n\n`;
  
  // Add results for each script
  results.forEach(result => {
    report += `### ${result.name}\n\n`;
    report += `- **Status**: ${result.success ? '✅ Completed' : '❌ Failed'}\n`;
    
    if (fs.existsSync(path.join(process.cwd(), result.report))) {
      report += `- **Detailed Report**: [${result.report}](${result.report})\n`;
    } else {
      report += `- **Detailed Report**: Not available\n`;
    }
    
    if (result.findings && result.findings !== 'No data available') {
      report += `\n${result.findings}\n`;
    }
    
    report += '\n';
  });
  
  // Add recommendations section
  report += `## Recommendations\n\n`;
  
  // Check if we have component consolidation findings
  const componentResult = results.find(r => r.name === 'Component Consolidation');
  if (componentResult && componentResult.success) {
    report += `### Component Structure\n\n`;
    report += `1. Implement the component consolidation plan to standardize tournament card components\n`;
    report += `2. Start with removing any unused components identified in the report\n`;
    report += `3. Migrate components one by one, with thorough testing after each change\n\n`;
  }
  
  // Check if we have dependency findings
  const depResult = results.find(r => r.name === 'Dependency Analysis');
  if (depResult && depResult.success) {
    report += `### Dependencies\n\n`;
    report += `1. Remove unused dependencies to reduce bundle size\n`;
    report += `2. Update outdated dependencies to fix security vulnerabilities\n`;
    report += `3. Set up automated dependency management with tools like Dependabot\n\n`;
  }
  
  // Check if we have performance findings
  const perfResult = results.find(r => r.name === 'Performance Analysis');
  if (perfResult && perfResult.success) {
    report += `### Performance\n\n`;
    report += `1. Implement memoization for components with frequent re-renders\n`;
    report += `2. Fix inline object and function creation in frequently rendered components\n`;
    report += `3. Consider code splitting and lazy loading for large components\n\n`;
  }
  
  // Check if we have security findings
  const secResult = results.find(r => r.name === 'Security Analysis');
  if (secResult && secResult.success) {
    report += `### Security\n\n`;
    report += `1. Address high severity security issues immediately\n`;
    report += `2. Remove any hardcoded secrets and move them to environment variables\n`;
    report += `3. Fix unsafe React patterns like dangerouslySetInnerHTML\n\n`;
  }
  
  // Check if we have test coverage findings
  const testResult = results.find(r => r.name === 'Test Coverage');
  if (testResult && testResult.success) {
    report += `### Testing\n\n`;
    report += `1. Focus on adding tests for uncovered components with high business value\n`;
    report += `2. Improve test quality for files with poor or minimal test coverage\n`;
    report += `3. Set up a coverage reporting tool for continuous monitoring\n\n`;
  }
  
  report += `## Next Steps\n\n`;
  report += `1. Prioritize issues based on severity and business impact\n`;
  report += `2. Create a roadmap for implementing the recommendations\n`;
  report += `3. Set up automated checks to prevent regression\n`;
  report += `4. Schedule regular audits to maintain code quality\n`;
  
  return report;
}

// Main function
async function runMasterAudit() {
  console.log('🚀 Starting Comprehensive Audit...');
  
  const results = [];
  
  // Make all scripts executable
  console.log('\n🔧 Making scripts executable...');
  scripts.forEach(script => {
    makeExecutable(script.script);
  });
  
  // Run each script
  for (const script of scripts) {
    const success = runScript(script.script);
    const reportPath = path.join(process.cwd(), script.report);
    const reportContent = readReportIfExists(reportPath);
    const findings = reportContent ? extractKeyFindings(reportContent, script.name) : 'No data available';
    
    results.push({
      name: script.name,
      success,
      report: script.report,
      findings
    });
  }
  
  // Create backup of all reports
  backupReports();
  
  // Generate master report
  console.log('\n📝 Generating comprehensive audit report...');
  const masterReport = generateMasterReport(results);
  fs.writeFileSync(MASTER_REPORT_PATH, masterReport);
  
  console.log(`\n✅ Audit complete! Comprehensive report saved to: ${MASTER_REPORT_PATH}`);
  
  // Print summary
  const successCount = results.filter(r => r.success).length;
  console.log(`\nSummary: ${successCount}/${results.length} analysis scripts completed successfully`);
  
  if (successCount < results.length) {
    console.log('\nSome analysis scripts failed. Check the output above for details.');
    console.log('You can run individual scripts directly to troubleshoot issues.');
  }
}

// Run the audit
runMasterAudit();
