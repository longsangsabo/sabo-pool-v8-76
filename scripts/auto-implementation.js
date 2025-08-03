#!/usr/bin/env node

/**
 * Auto-Implementation Script
 * 
 * This script reads the analysis reports and automatically applies
 * some of the suggested changes, focusing on:
 * 1. Standardizing enum usage
 * 2. Replacing redundant tournament cards with UnifiedTournamentCard
 * 3. Removing unused dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const REPORTS_DIR = path.join(process.cwd(), 'reports');
const SRC_DIR = path.join(process.cwd(), 'src');

console.log('🚀 Starting automated implementation of suggested changes...\n');

// Check if reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  console.error('❌ Reports directory not found! Run master-analysis.js first.');
  process.exit(1);
}

// Function to read a report file
function readReport(filename) {
  const filePath = path.join(REPORTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return null;
}

// Function to apply enum standardization
async function standardizeEnums() {
  const report = readReport('enum-standardization-report.md');
  if (!report) {
    console.log('❓ Enum standardization report not found, skipping...');
    return;
  }
  
  console.log('🔄 Standardizing enum usage...');
  
  // Parse report to find issues
  const sections = report.split('## ').filter(Boolean);
  let changes = 0;
  
  for (const section of sections) {
    if (!section.startsWith('TournamentType') && 
        !section.startsWith('GameFormat') && 
        !section.startsWith('TournamentStatus') &&
        !section.startsWith('RegistrationStatus')) {
      continue;
    }
    
    const enumName = section.split('\n')[0].trim();
    const valueBlocks = section.split('### Value:').filter(Boolean).slice(1);
    
    for (const block of valueBlocks) {
      const lines = block.split('\n');
      const valueLine = lines[0];
      const value = valueLine.match(/`([^`]+)`/)[1];
      
      // Get occurrences
      const occurrenceLines = [];
      let inOccurrences = false;
      
      for (const line of lines) {
        if (line.includes('Found in') && line.includes('locations:')) {
          inOccurrences = true;
          continue;
        }
        
        if (inOccurrences && line.startsWith('- ')) {
          occurrenceLines.push(line.substring(2).trim());
        }
        
        if (inOccurrences && line.includes('#### Suggested replacement:')) {
          break;
        }
      }
      
      // Process each occurrence
      for (const occurrence of occurrenceLines) {
        const [filePath, ...context] = occurrence.split(':');
        
        try {
          // Read file
          const fullPath = path.join(process.cwd(), filePath);
          if (!fs.existsSync(fullPath)) continue;
          
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Check if import already exists
          const importLine = `import { ${enumName} } from '@/types/tournament-enums';`;
          const hasImport = content.includes(importLine) || content.includes(`from '@/types/tournament-enums'`);
          
          // Prepare new content
          let newContent = content;
          
          // Add import if needed
          if (!hasImport) {
            // Find appropriate place for import
            const lines = content.split('\n');
            let importIndex = 0;
            
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes('import ') && lines[i].includes(' from ')) {
                importIndex = i + 1;
              } else if (!lines[i].trim().startsWith('import ') && importIndex > 0) {
                break;
              }
            }
            
            lines.splice(importIndex, 0, importLine);
            newContent = lines.join('\n');
          }
          
          // Replace string literals with enum values
          const enumValueKey = value.toUpperCase();
          const stringLiteral = `'${value}'`;
          const stringLiteralDouble = `"${value}"`;
          const enumValue = `${enumName}.${enumValueKey}`;
          
          newContent = newContent
            .replace(new RegExp(stringLiteral, 'g'), enumValue)
            .replace(new RegExp(stringLiteralDouble, 'g'), enumValue);
          
          // Write changes if content was modified
          if (newContent !== content) {
            fs.writeFileSync(fullPath, newContent);
            changes++;
            console.log(`✅ Updated enum usage in ${filePath}`);
          }
        } catch (error) {
          console.error(`❌ Error processing ${filePath}:`, error.message);
        }
      }
    }
  }
  
  console.log(`✅ Standardized ${changes} enum usages`);
}

// Function to consolidate tournament cards
async function consolidateTournamentCards() {
  const report = readReport('tournament-card-consolidation-plan.md');
  if (!report) {
    console.log('❓ Tournament card consolidation report not found, skipping...');
    return;
  }
  
  console.log('🔄 Consolidating tournament cards...');
  
  // Parse report to find redundant cards
  const sections = report.split('### ').filter(Boolean).slice(1);
  let changes = 0;
  
  for (const section of sections) {
    const lines = section.split('\n');
    const titleLine = lines[0];
    
    // Extract component name and usage count
    const componentMatch = titleLine.match(/(.+TournamentCard\.tsx) \((\d+) usages\)/);
    if (!componentMatch) continue;
    
    const componentName = componentMatch[1];
    const usageCount = parseInt(componentMatch[2]);
    
    // Skip if it's heavily used
    if (usageCount > 15) {
      console.log(`⚠️ Skipping ${componentName} as it has ${usageCount} usages (too many for automated replacement)`);
      continue;
    }
    
    // Find path
    let componentPath = '';
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith('Path:')) {
        componentPath = lines[i].replace('Path:', '').trim().replace(/`/g, '');
        break;
      }
    }
    
    // Determine variant type
    let variant = 'simple';
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].includes('Suggested UnifiedTournamentCard variant:')) {
        if (lines[i].includes('interactive')) {
          variant = 'interactive';
        }
        break;
      }
    }
    
    // Find usages
    let inUsages = false;
    const usages = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].includes('#### Usages:')) {
        inUsages = true;
        continue;
      }
      
      if (inUsages && lines[i].startsWith('- ')) {
        usages.push(lines[i].substring(2).trim());
      }
      
      if (inUsages && lines[i].includes('#### Migration Strategy:')) {
        break;
      }
    }
    
    // Process each usage
    for (const usage of usages) {
      const [filePath, ...context] = usage.split(':');
      
      try {
        // Read file
        const fullPath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) continue;
        
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if already using UnifiedTournamentCard
        if (content.includes('UnifiedTournamentCard')) continue;
        
        // Prepare new content
        let newContent = content;
        
        // Replace import statement
        const componentBaseName = componentName.replace('.tsx', '');
        const importPattern = new RegExp(`import.*${componentBaseName}.*from.*`, 'g');
        
        newContent = newContent.replace(importPattern, `import { UnifiedTournamentCard } from '@/components/tournament/UnifiedTournamentCard';`);
        
        // Replace component usage
        const usagePattern = new RegExp(`<${componentBaseName}([^>]*)>`, 'g');
        newContent = newContent.replace(usagePattern, `<UnifiedTournamentCard variant="${variant}"$1>`);
        
        const closingPattern = new RegExp(`</${componentBaseName}>`, 'g');
        newContent = newContent.replace(closingPattern, `</UnifiedTournamentCard>`);
        
        // Write changes if content was modified
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent);
          changes++;
          console.log(`✅ Updated ${componentBaseName} usage in ${filePath}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    }
  }
  
  console.log(`✅ Consolidated ${changes} tournament card usages`);
}

// Function to clean up unused dependencies
async function cleanupDependencies() {
  const report = readReport('dependency-cleanup-report.md');
  if (!report) {
    console.log('❓ Dependency cleanup report not found, skipping...');
    return;
  }
  
  console.log('🔄 Cleaning up unused dependencies...');
  
  // Extract commands from report
  const commandMatches = report.match(/```bash\n(npm uninstall .+)\n```/g);
  if (!commandMatches || commandMatches.length === 0) {
    console.log('❓ No cleanup commands found in report');
    return;
  }
  
  const commands = commandMatches.map(match => {
    return match.replace(/```bash\n/, '').replace(/\n```/, '');
  });
  
  // Execute each command
  for (const command of commands) {
    console.log(`Executing: ${command}`);
    try {
      const { stdout, stderr } = await exec(command);
      console.log(stdout);
      if (stderr) console.warn(stderr);
    } catch (error) {
      console.error(`❌ Error executing command: ${command}`, error.message);
    }
  }
  
  console.log(`✅ Dependency cleanup complete`);
}

// Main function
async function applyChanges() {
  // Create a backup directory
  const backupDir = path.join(process.cwd(), 'backup', `auto-implementation-${Date.now()}`);
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Backup src directory
  console.log('📦 Creating backup of src directory...');
  try {
    execSync(`cp -r ${SRC_DIR} ${backupDir}/`);
    console.log(`✅ Backup created at ${backupDir}`);
  } catch (error) {
    console.error('❌ Failed to create backup, aborting:', error.message);
    return;
  }
  
  // Apply changes
  await standardizeEnums();
  await consolidateTournamentCards();
  await cleanupDependencies();
  
  console.log('\n✅ All automated changes applied successfully!');
  console.log(`📦 A backup of the original src directory was created at ${backupDir}`);
  console.log('⚠️ Please review the changes and run tests to ensure everything works correctly.');
}

applyChanges().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
