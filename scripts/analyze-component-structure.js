#!/usr/bin/env node

/**
 * Component Structure Analyzer
 * 
 * This script analyzes the component folder structure and suggests 
 * reorganizations based on grouping, cohesion, and best practices.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(process.cwd(), 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

console.log('🔍 Analyzing component folder structure...');

// Function to get all components recursively
function getAllComponents(directory) {
  const components = [];
  
  function scanDir(dirPath, relativePath = '') {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // It's a subdirectory
        scanDir(itemPath, itemRelativePath);
      } else if (stats.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        // Skip index files
        if (item === 'index.ts' || item === 'index.tsx') return;
        
        components.push({
          name: item,
          path: itemPath,
          directory: path.dirname(itemPath),
          relativePath: path.relative(COMPONENTS_DIR, itemPath)
        });
      }
    });
  }
  
  scanDir(directory);
  return components;
}

// Function to analyze component relationships
function analyzeRelationships(components) {
  const relationships = {};
  
  // For each component, find other components that import it
  components.forEach(component => {
    const componentName = component.name.replace(/\.(tsx|ts)$/, '');
    relationships[componentName] = [];
    
    components.forEach(other => {
      if (component.path === other.path) return;
      
      const otherContent = fs.readFileSync(other.path, 'utf8');
      if (otherContent.includes(`import`) && otherContent.includes(componentName)) {
        relationships[componentName].push(other.name.replace(/\.(tsx|ts)$/, ''));
      }
    });
  });
  
  return relationships;
}

// Function to group components by category
function groupComponentsByCategory(components) {
  const categories = {};
  
  components.forEach(component => {
    const name = component.name.toLowerCase();
    let category = 'misc';
    
    // Try to determine category from name or path
    if (component.relativePath.startsWith('tournament/')) {
      category = 'tournament';
    } else if (name.includes('tournament')) {
      category = 'tournament';
    } else if (name.includes('modal') || name.includes('dialog')) {
      category = 'modals';
    } else if (name.includes('form') || name.includes('input') || name.includes('select')) {
      category = 'forms';
    } else if (name.includes('table') || name.includes('grid') || name.includes('list')) {
      category = 'tables';
    } else if (name.includes('card')) {
      category = 'cards';
    } else if (name.includes('button') || name.includes('action')) {
      category = 'buttons';
    } else if (name.includes('nav') || name.includes('menu')) {
      category = 'navigation';
    } else if (name.includes('layout') || name.includes('container')) {
      category = 'layouts';
    } else if (name.includes('icon')) {
      category = 'icons';
    } else if (name.includes('chart') || name.includes('graph')) {
      category = 'charts';
    } else if (name.includes('avatar') || name.includes('profile')) {
      category = 'avatars';
    }
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push({
      ...component,
      name: component.name.replace(/\.(tsx|ts)$/, '')
    });
  });
  
  return categories;
}

// Function to suggest reorganization
function suggestReorganization(categories, relationships) {
  let suggestions = [];
  
  // Find categories with many components
  Object.entries(categories).forEach(([category, components]) => {
    if (components.length > 10) {
      suggestions.push({
        type: 'split_category',
        category,
        count: components.length,
        message: `Consider splitting ${category} category (${components.length} components) into subcategories`
      });
    }
  });
  
  // Find components with many relationships
  Object.entries(relationships).forEach(([component, relatedComponents]) => {
    if (relatedComponents.length > 5) {
      suggestions.push({
        type: 'high_coupling',
        component,
        count: relatedComponents.length,
        message: `${component} is imported by ${relatedComponents.length} other components - consider if it should be a shared utility`
      });
    }
  });
  
  // Find components in the wrong category
  Object.entries(categories).forEach(([category, components]) => {
    components.forEach(component => {
      const name = component.name.toLowerCase();
      
      // Check if component name suggests it belongs in a different category
      if (category !== 'tournament' && name.includes('tournament')) {
        suggestions.push({
          type: 'wrong_category',
          component: component.name,
          currentCategory: category,
          suggestedCategory: 'tournament',
          message: `${component.name} contains "tournament" but is in "${category}" category`
        });
      }
    });
  });
  
  return suggestions;
}

// Function to generate report
function generateReport(components, categories, relationships, suggestions) {
  let report = `# Component Structure Analysis\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  report += `## Overview\n\n`;
  report += `- Total components: ${components.length}\n`;
  report += `- Categories: ${Object.keys(categories).length}\n\n`;
  
  report += `## Category Breakdown\n\n`;
  Object.entries(categories).sort((a, b) => b[1].length - a[1].length).forEach(([category, comps]) => {
    report += `### ${category} (${comps.length})\n\n`;
    comps.forEach(comp => {
      report += `- ${comp.name}\n`;
    });
    report += '\n';
  });
  
  if (suggestions.length > 0) {
    report += `## Reorganization Suggestions\n\n`;
    
    // Group suggestions by type
    const suggestionsByType = suggestions.reduce((acc, suggestion) => {
      if (!acc[suggestion.type]) {
        acc[suggestion.type] = [];
      }
      acc[suggestion.type].push(suggestion);
      return acc;
    }, {});
    
    if (suggestionsByType.split_category) {
      report += `### Large Categories\n\n`;
      suggestionsByType.split_category.forEach(suggestion => {
        report += `- ${suggestion.message}\n`;
      });
      report += '\n';
    }
    
    if (suggestionsByType.high_coupling) {
      report += `### High Coupling\n\n`;
      suggestionsByType.high_coupling.forEach(suggestion => {
        report += `- ${suggestion.message}\n`;
      });
      report += '\n';
    }
    
    if (suggestionsByType.wrong_category) {
      report += `### Misplaced Components\n\n`;
      suggestionsByType.wrong_category.forEach(suggestion => {
        report += `- ${suggestion.message}\n`;
      });
      report += '\n';
    }
  }
  
  report += `## Proposed Structure\n\n`;
  report += `Based on the analysis, here's a proposed folder structure:\n\n`;
  report += '```\n';
  report += 'src/\n';
  report += '  components/\n';
  
  // Generate suggested structure
  const ignoredCategories = ['misc'];
  Object.keys(categories)
    .filter(category => !ignoredCategories.includes(category))
    .sort()
    .forEach(category => {
      report += `    ${category}/\n`;
      
      // If category is large, suggest subcategories
      const categoryComponents = categories[category];
      if (categoryComponents.length > 10) {
        // Try to identify potential subcategories
        const subcategories = {};
        categoryComponents.forEach(comp => {
          const name = comp.name.toLowerCase();
          let subcategory = 'core';
          
          if (name.includes('form') || name.includes('input')) {
            subcategory = 'forms';
          } else if (name.includes('card')) {
            subcategory = 'cards';
          } else if (name.includes('list') || name.includes('table')) {
            subcategory = 'lists';
          } else if (name.includes('modal') || name.includes('dialog')) {
            subcategory = 'modals';
          } else if (name.includes('button') || name.includes('action')) {
            subcategory = 'actions';
          }
          
          if (!subcategories[subcategory]) {
            subcategories[subcategory] = [];
          }
          subcategories[subcategory].push(comp);
        });
        
        Object.keys(subcategories).sort().forEach(sub => {
          report += `      ${sub}/\n`;
        });
      }
    });
  
  report += '  ...\n';
  report += '```\n\n';
  
  return report;
}

// Main function
function analyzeComponentStructure() {
  // Get all components
  const components = getAllComponents(COMPONENTS_DIR);
  console.log(`Found ${components.length} components`);
  
  // Analyze relationships
  const relationships = analyzeRelationships(components);
  
  // Group by category
  const categories = groupComponentsByCategory(components);
  
  // Generate suggestions
  const suggestions = suggestReorganization(categories, relationships);
  
  // Generate report
  const report = generateReport(components, categories, relationships, suggestions);
  const reportPath = path.join(process.cwd(), 'component-structure-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Component structure report generated at: ${reportPath}`);
  console.log(`Generated ${suggestions.length} reorganization suggestions`);
}

analyzeComponentStructure();
