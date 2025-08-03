#!/usr/bin/env node

/**
 * Tournament Card Consolidation Script
 * 
 * This script identifies and helps consolidate redundant tournament card components
 * by finding all components that could be replaced by the UnifiedTournamentCard.
 * 
 * It looks for components with names like *TournamentCard*, analyzes their usage,
 * and suggests replacements.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(process.cwd(), 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

console.log('🔍 Scanning for redundant tournament card components...');

// Function to find all tournament card components
function findTournamentCardComponents() {
  try {
    const grepCommand = `find ${COMPONENTS_DIR} -type f -name "*TournamentCard*.tsx" | grep -v "UnifiedTournamentCard.tsx"`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    
    return result.trim().split('\n').filter(Boolean).map(filePath => {
      const fileName = path.basename(filePath);
      return {
        name: fileName,
        path: filePath,
        relativePath: path.relative(process.cwd(), filePath)
      };
    });
  } catch (error) {
    console.error('Error finding tournament card components:', error.message);
    return [];
  }
}

// Function to analyze component usage
function analyzeComponentUsage(componentPath) {
  try {
    const componentName = path.basename(componentPath, path.extname(componentPath));
    
    // Find imports of this component
    const grepCommand = `grep -r --include="*.{ts,tsx}" "${componentName}" ${SRC_DIR} | grep -v "${componentPath}"`;
    const result = execSync(grepCommand, { encoding: 'utf8' });
    
    // Parse usage count and files
    const imports = result.trim().split('\n').filter(Boolean);
    
    return {
      usageCount: imports.length,
      imports: imports,
      componentContent: fs.readFileSync(componentPath, 'utf8')
    };
  } catch (error) {
    // If grep returns non-zero (i.e., no matches), component is unused
    return { 
      usageCount: 0, 
      imports: [],
      componentContent: fs.existsSync(componentPath) ? fs.readFileSync(componentPath, 'utf8') : ''
    };
  }
}

// Function to generate migration plan
function generateMigrationPlan(components) {
  let report = `# Tournament Card Consolidation Plan\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  report += `This report identifies redundant tournament card components that can be replaced with UnifiedTournamentCard.\n\n`;
  
  report += `## Components to Consolidate\n\n`;
  
  components.forEach(comp => {
    report += `### ${comp.name} (${comp.usageCount} usages)\n\n`;
    report += `Path: \`${comp.relativePath}\`\n\n`;
    
    report += `#### Usages:\n`;
    comp.imports.forEach(imp => {
      report += `- ${imp}\n`;
    });
    
    report += `\n#### Migration Strategy:\n`;
    
    const isSimple = !comp.componentContent.includes('onClick') && !comp.componentContent.includes('onRegister');
    
    report += `- Replacement type: ${isSimple ? 'Simple (static display)' : 'Interactive (with handlers)'}\n`;
    report += `- Suggested UnifiedTournamentCard variant: \`${isSimple ? 'simple' : 'interactive'}\`\n`;
    
    report += `\n`;
  });
  
  report += `## Implementation Steps\n\n`;
  report += `1. Replace imports of redundant card components with \`UnifiedTournamentCard\`\n`;
  report += `2. Update component usage to pass appropriate props\n`;
  report += `3. For interactive cards, ensure event handlers are properly mapped\n`;
  report += `4. Remove redundant card components after migrating all usages\n`;
  
  return report;
}

// Main function
function consolidateTournamentCards() {
  // Find components
  const cardComponents = findTournamentCardComponents();
  console.log(`Found ${cardComponents.length} tournament card components (excluding UnifiedTournamentCard)`);
  
  // Analyze usage
  const analyzedComponents = cardComponents.map(comp => {
    const usage = analyzeComponentUsage(comp.path);
    return {
      ...comp,
      ...usage
    };
  });
  
  // Generate report
  const report = generateMigrationPlan(analyzedComponents);
  const reportPath = path.join(process.cwd(), 'tournament-card-consolidation-plan.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Consolidation plan generated at: ${reportPath}`);
}

consolidateTournamentCards();
