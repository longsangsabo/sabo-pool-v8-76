#!/usr/bin/env node

/**
 * Enum Standardization Utility
 * 
 * This script helps detect and standardize enum usage across the codebase.
 * It identifies inconsistent string literals that should be using enums.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(process.cwd(), 'src');
const TYPES_DIR = path.join(SRC_DIR, 'types');

// Known enums from tournament-enums.ts
const KNOWN_ENUMS = {
  TournamentType: ['single_elimination', 'double_elimination', 'round_robin', 'swiss'],
  GameFormat: ['8_ball', '9_ball', '10_ball', 'straight_pool'],
  TournamentStatus: ['registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'],
  TournamentManagementStatus: ['open', 'locked', 'ongoing', 'completed'],
  RegistrationStatus: ['not_started', 'open', 'closed', 'ended']
};

console.log('🔍 Scanning for inconsistent enum usage...');

// Function to find hardcoded enum values
function findHardcodedEnumValues() {
  const results = {};
  
  Object.entries(KNOWN_ENUMS).forEach(([enumName, values]) => {
    results[enumName] = [];
    
    values.forEach(value => {
      try {
        // Find files containing the hardcoded string literal
        const grepCommand = `grep -r --include="*.{ts,tsx}" "['\\"]${value}['\\"]" ${SRC_DIR} | grep -v "${TYPES_DIR}/tournament-enums.ts"`;
        const result = execSync(grepCommand, { encoding: 'utf8' });
        
        if (result.trim()) {
          const occurrences = result.trim().split('\n').filter(Boolean);
          results[enumName].push({
            value,
            occurrences
          });
        }
      } catch (error) {
        // No occurrences found
      }
    });
  });
  
  return results;
}

// Function to generate standardization report
function generateReport(results) {
  let report = `# Enum Standardization Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  report += `This report identifies places in the code where string literals are used instead of proper enums.\n\n`;
  
  let hasIssues = false;
  
  Object.entries(results).forEach(([enumName, values]) => {
    if (values.length > 0) {
      hasIssues = true;
      report += `## ${enumName}\n\n`;
      
      values.forEach(({ value, occurrences }) => {
        report += `### Value: \`${value}\`\n\n`;
        report += `Found in ${occurrences.length} locations:\n\n`;
        
        occurrences.forEach(occurrence => {
          report += `- ${occurrence}\n`;
        });
        
        report += `\n#### Suggested replacement:\n\n`;
        report += `\`\`\`typescript\n`;
        report += `import { ${enumName} } from '@/types/tournament-enums';\n\n`;
        report += `// Replace string literal '${value}' with:\n`;
        report += `${enumName}.${value.toUpperCase()}\n`;
        report += `\`\`\`\n\n`;
      });
    }
  });
  
  if (!hasIssues) {
    report += `✅ No inconsistent enum usage found!\n\n`;
  }
  
  return report;
}

// Main function
function standardizeEnums() {
  // Find hardcoded values
  const results = findHardcodedEnumValues();
  
  // Generate report
  const report = generateReport(results);
  const reportPath = path.join(process.cwd(), 'enum-standardization-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Enum standardization report generated at: ${reportPath}`);
  
  // Count total issues
  let totalIssues = 0;
  Object.values(results).forEach(values => {
    values.forEach(({ occurrences }) => {
      totalIssues += occurrences.length;
    });
  });
  
  console.log(`Found ${totalIssues} instances where string literals should be replaced with enum values`);
}

standardizeEnums();
