#!/usr/bin/env node

/**
 * Master Workflow Script - Enhanced for V8.76
 * 
 * This script orchestrates the entire code analysis, refactoring, and optimization workflow
 * in a single automated process.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create directories
const REPORTS_DIR = path.join(process.cwd(), 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const BACKUP_DIR = path.join(process.cwd(), 'backup', `full-backup-${Date.now()}`);
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Backup important files
console.log('Creating backup...');
try {
  execSync(`cp -r ${path.join(process.cwd(), 'src')} ${BACKUP_DIR}/`);
  
  const filesToBackup = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    '.eslintrc.js',
    'tailwind.config.ts'
  ];
  
  filesToBackup.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      execSync(`cp ${filePath} ${BACKUP_DIR}/`);
    }
  });
  
  console.log(`✅ Backup created at ${BACKUP_DIR}`);
} catch (error) {
  console.error('❌ Backup creation failed:', error.message);
}

// Function to run a step and handle errors
function runStep(name, command) {
  console.log(`\n=== Running ${name} ===`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${name} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    return false;
  }
}

// Main workflow steps
const steps = [
  {
    name: 'Component Usage Analysis',
    command: 'node scripts/find-dead-tournament-components.js'
  },
  {
    name: 'Tournament Card Consolidation',
    command: 'node scripts/consolidate-tournament-cards.js'
  },
  {
    name: 'Dependency Cleanup',
    command: 'node scripts/cleanup-dependencies.js'
  },
  {
    name: 'Enum Standardization',
    command: 'node scripts/standardize-enums.js'
  },
  {
    name: 'Component Structure Analysis',
    command: 'node scripts/analyze-component-structure.js'
  },
  {
    name: 'Auto Implementation',
    command: 'node scripts/auto-implementation.js'
  },
  {
    name: 'Automated Testing',
    command: 'node scripts/automated-testing.js'
  },
  {
    name: 'Performance Analysis',
    command: 'node scripts/analyze-performance.js'
  },
  {
    name: 'Security Analysis',
    command: 'node scripts/analyze-security.js'
  }
];

// Execute workflow
console.log('🚀 Starting comprehensive workflow...');

const results = {};

steps.forEach(step => {
  results[step.name] = runStep(step.name, step.command);
});

// Generate final report
console.log('\n=== Generating Summary Report ===');

let summaryReport = `# Comprehensive Workflow Summary Report\n\n`;
summaryReport += `Date: ${new Date().toISOString()}\n\n`;

// Results table
summaryReport += `## Results\n\n`;
summaryReport += `| Step | Status |\n`;
summaryReport += `| ---- | ------ |\n`;

Object.entries(results).forEach(([step, success]) => {
  summaryReport += `| ${step} | ${success ? '✅ Passed' : '❌ Failed'} |\n`;
});

// Report links
summaryReport += `\n## Report Links\n\n`;
try {
  const reportFiles = fs.readdirSync(REPORTS_DIR);
  reportFiles.forEach(file => {
    summaryReport += `- [${file.replace('.md', '')}](./reports/${file})\n`;
  });
} catch (error) {
  summaryReport += `*No report files found in reports directory*\n`;
}

// Check for other generated reports
const workspaceFiles = fs.readdirSync(process.cwd());
const reportRegex = /.*-report\.md|.*-plan\.md|test-results\.md|WORKFLOW_REPORT\.md/;
const otherReports = workspaceFiles.filter(file => reportRegex.test(file));

if (otherReports.length > 0) {
  summaryReport += `\n### Additional Reports\n\n`;
  otherReports.forEach(file => {
    summaryReport += `- [${file.replace('.md', '')}](./${file})\n`;
  });
}

// Write summary report
const summaryPath = path.join(process.cwd(), 'WORKFLOW_SUMMARY.md');
fs.writeFileSync(summaryPath, summaryReport);

console.log(`\n✅ Workflow completed! Summary report generated at: ${summaryPath}`);
