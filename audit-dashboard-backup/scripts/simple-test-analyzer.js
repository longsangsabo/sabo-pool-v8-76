#!/usr/bin/env node

/**
 * Simple Test Coverage Analyzer
 * 
 * This script analyzes test coverage by finding components without tests
 * and recommending testing strategies for different parts of the codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(process.cwd(), 'src');
const REPORT_PATH = path.join(process.cwd(), 'test-coverage-report.md');

console.log('🔍 Analyzing test coverage...');

// Function to find source files and their corresponding test files
function findSourceAndTestFiles() {
  try {
    // Find all source files
    const sourceCommand = `find ${SRC_DIR} -type f -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -v ".test." | grep -v ".spec." | grep -v "node_modules" | grep -v "tests/"`;
    const sourceOutput = execSync(sourceCommand, { encoding: 'utf8' });
    const sourceFiles = sourceOutput.trim().split('\n').filter(Boolean);
    
    // Find all test files
    const testCommand = `find ${SRC_DIR} -type f -name "*.test.tsx" -o -name "*.test.ts" -o -name "*.test.jsx" -o -name "*.test.js" -o -name "*.spec.tsx" -o -name "*.spec.ts" -o -name "*.spec.jsx" -o -name "*.spec.js" | grep -v "node_modules"`;
    const testOutput = execSync(testCommand, { encoding: 'utf8' });
    const testFiles = testOutput.trim().split('\n').filter(Boolean);
    
    return { sourceFiles, testFiles };
  } catch (error) {
    console.error('Error finding source and test files:', error.message);
    return { sourceFiles: [], testFiles: [] };
  }
}

// Function to analyze test coverage
function analyzeTestCoverage(sourceFiles, testFiles) {
  // Create a mapping of base names to test files
  const testFileMap = {};
  testFiles.forEach(testFile => {
    const basename = path.basename(testFile)
      .replace(/\.test\.(tsx|ts|jsx|js)$/, '')
      .replace(/\.spec\.(tsx|ts|jsx|js)$/, '');
    testFileMap[basename] = testFile;
  });
  
  // Analyze each source file
  return sourceFiles.map(sourceFile => {
    const basename = path.basename(sourceFile).replace(/\.(tsx|ts|jsx|js)$/, '');
    const dirname = path.dirname(sourceFile);
    const relPath = path.relative(SRC_DIR, sourceFile);
    
    // Common test file patterns
    const possibleTestFiles = [
      testFileMap[basename],
      testFiles.find(tf => tf.includes(`${basename}.test`)),
      testFiles.find(tf => tf.includes(`${basename}.spec`)),
      testFiles.find(tf => tf.includes(path.join(dirname, '__tests__', basename))),
      testFiles.find(tf => tf.includes(path.join(dirname, 'tests', basename)))
    ].filter(Boolean);
    
    // Check what kind of file this is
    let fileType = 'unknown';
    try {
      const content = fs.readFileSync(sourceFile, 'utf8');
      
      if (content.includes('React.') || content.includes('import React') || 
          content.includes('from "react"') || content.includes("from 'react'")) {
        if (content.includes('export default') && (content.includes('function') || content.includes('=>'))) {
          fileType = 'component';
        } else if (content.includes('createContext')) {
          fileType = 'context';
        } else if (content.includes('reducer') && (content.includes('switch') || content.includes('action.type'))) {
          fileType = 'reducer';
        } else if (content.includes('hook') || content.includes('useState') || content.includes('useEffect')) {
          fileType = 'hook';
        }
      } else if (content.includes('function') && content.includes('export')) {
        fileType = 'util';
      } else if (content.includes('interface') || content.includes('type ') || content.includes('enum ')) {
        fileType = 'type';
      } else if (content.includes('class ') && content.includes('extends ')) {
        fileType = 'class';
      }
    } catch (error) {
      console.error(`Error reading file ${sourceFile}:`, error.message);
    }
    
    return {
      sourceFile,
      relPath,
      basename,
      testFile: possibleTestFiles[0] || null,
      hasCoverage: possibleTestFiles.length > 0,
      fileType
    };
  });
}

// Function to generate test recommendations based on file type
function getTestRecommendations(fileType) {
  switch(fileType) {
    case 'component':
      return 'Use React Testing Library to test rendering and interactions. Focus on user behavior rather than implementation details.';
    case 'hook':
      return 'Use @testing-library/react-hooks for testing custom hooks. Test different input scenarios and state transitions.';
    case 'util':
      return 'Use Jest for unit testing. Test edge cases and ensure functions return expected outputs for various inputs.';
    case 'reducer':
      return 'Test each action type individually. Ensure reducer returns correct state for each action and maintains immutability.';
    case 'context':
      return 'Test the context provider with various values. Ensure consumers receive updated context values correctly.';
    case 'class':
      return 'Test public methods and state changes. Consider testing lifecycle methods if relevant.';
    case 'type':
      return 'TypeScript types don\'t need runtime tests, but consider testing type guards or type utilities if present.';
    default:
      return 'Analyze the file\'s functionality and write appropriate tests based on its purpose.';
  }
}

// Function to analyze test quality for files that have tests
function analyzeTestQuality(coveredFiles) {
  return coveredFiles.map(file => {
    if (!file.testFile) return { ...file, testQuality: null };
    
    try {
      const testContent = fs.readFileSync(file.testFile, 'utf8');
      
      const metrics = {
        testCount: (testContent.match(/it\s*\(/g) || []).length + (testContent.match(/test\s*\(/g) || []).length,
        assertionCount: (testContent.match(/expect\s*\(/g) || []).length,
        mockCount: (testContent.match(/jest\.mock/g) || []).length + (testContent.match(/mock\s*\(/g) || []).length,
        usesRTL: testContent.includes('render(') && (testContent.includes('testing-library') || testContent.includes('testingLibrary'))
      };
      
      let qualityScore = 0;
      let qualityNotes = [];
      
      // Basic heuristics for test quality
      if (metrics.testCount === 0) {
        qualityNotes.push('No test cases found.');
      } else if (metrics.testCount < 2) {
        qualityNotes.push('Only one test case found. Consider adding more test cases for better coverage.');
        qualityScore += 1;
      } else {
        qualityNotes.push(`${metrics.testCount} test cases found.`);
        qualityScore += 2;
      }
      
      if (metrics.assertionCount === 0) {
        qualityNotes.push('No assertions found.');
      } else if (metrics.assertionCount < metrics.testCount) {
        qualityNotes.push('Some test cases might be missing assertions.');
        qualityScore += 1;
      } else {
        qualityNotes.push(`${metrics.assertionCount} assertions found.`);
        qualityScore += 2;
      }
      
      if (file.fileType === 'component' && !metrics.usesRTL) {
        qualityNotes.push('Component tests should use React Testing Library for better user-centric testing.');
      } else if (file.fileType === 'component' && metrics.usesRTL) {
        qualityNotes.push('Using React Testing Library for component tests is good practice.');
        qualityScore += 1;
      }
      
      let qualityLevel = 'unknown';
      if (qualityScore >= 4) {
        qualityLevel = 'good';
      } else if (qualityScore >= 2) {
        qualityLevel = 'moderate';
      } else if (qualityScore >= 1) {
        qualityLevel = 'minimal';
      } else {
        qualityLevel = 'poor';
      }
      
      return {
        ...file,
        testQuality: {
          metrics,
          qualityNotes,
          qualityLevel
        }
      };
    } catch (error) {
      console.error(`Error analyzing test quality for ${file.testFile}:`, error.message);
      return { ...file, testQuality: null };
    }
  });
}

// Function to generate coverage report
function generateReport(coverage) {
  let report = `# Test Coverage Analysis Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  // Calculate statistics
  const totalFiles = coverage.length;
  const coveredFiles = coverage.filter(file => file.hasCoverage);
  const coverageRate = (coveredFiles.length / totalFiles * 100).toFixed(2);
  
  const fileTypeStats = {};
  coverage.forEach(file => {
    if (!fileTypeStats[file.fileType]) {
      fileTypeStats[file.fileType] = { total: 0, covered: 0 };
    }
    fileTypeStats[file.fileType].total++;
    if (file.hasCoverage) {
      fileTypeStats[file.fileType].covered++;
    }
  });
  
  // Overview section
  report += `## Overview\n\n`;
  report += `- Total source files: ${totalFiles}\n`;
  report += `- Files with tests: ${coveredFiles.length}\n`;
  report += `- Test coverage rate: ${coverageRate}%\n\n`;
  
  // Coverage by file type
  report += `## Coverage by File Type\n\n`;
  report += `| File Type | Files | Covered | Coverage Rate |\n`;
  report += `| --------- | ----- | ------- | ------------- |\n`;
  
  Object.keys(fileTypeStats).sort().forEach(fileType => {
    const stats = fileTypeStats[fileType];
    const typeRate = (stats.covered / stats.total * 100).toFixed(2);
    report += `| ${fileType || 'unknown'} | ${stats.total} | ${stats.covered} | ${typeRate}% |\n`;
  });
  report += `\n`;
  
  // Files without tests
  const uncoveredFiles = coverage.filter(file => !file.hasCoverage);
  report += `## Uncovered Files (${uncoveredFiles.length})\n\n`;
  
  if (uncoveredFiles.length === 0) {
    report += `All files have test coverage. Great job!\n\n`;
  } else {
    // Group by file type
    const uncoveredByType = {};
    uncoveredFiles.forEach(file => {
      if (!uncoveredByType[file.fileType]) {
        uncoveredByType[file.fileType] = [];
      }
      uncoveredByType[file.fileType].push(file);
    });
    
    Object.keys(uncoveredByType).sort().forEach(fileType => {
      report += `### ${fileType || 'Unknown'} Files (${uncoveredByType[fileType].length})\n\n`;
      report += `| File | Testing Strategy |\n`;
      report += `| ---- | --------------- |\n`;
      
      uncoveredByType[fileType].forEach(file => {
        const recommendation = getTestRecommendations(file.fileType);
        report += `| ${file.relPath} | ${recommendation} |\n`;
      });
      report += `\n`;
    });
  }
  
  // Test quality analysis
  report += `## Test Quality Analysis\n\n`;
  report += `For files that have tests, an analysis of test quality:\n\n`;
  
  const qualityLevels = ['good', 'moderate', 'minimal', 'poor', 'unknown'];
  qualityLevels.forEach(level => {
    const filesWithLevel = coveredFiles.filter(f => f.testQuality && f.testQuality.qualityLevel === level);
    if (filesWithLevel.length > 0) {
      report += `### ${level.charAt(0).toUpperCase() + level.slice(1)} Quality Tests (${filesWithLevel.length})\n\n`;
      
      if (level !== 'good') {
        report += `| Source File | Test File | Notes | Improvement Suggestions |\n`;
        report += `| ----------- | --------- | ----- | ---------------------- |\n`;
        
        filesWithLevel.forEach(file => {
          if (!file.testQuality) return;
          
          const notes = file.testQuality.qualityNotes.join(' ');
          let suggestions = '';
          
          if (file.testQuality.metrics.testCount < 2) {
            suggestions += 'Add more test cases. ';
          }
          if (file.testQuality.metrics.assertionCount < file.testQuality.metrics.testCount) {
            suggestions += 'Add more assertions. ';
          }
          if (file.fileType === 'component' && !file.testQuality.metrics.usesRTL) {
            suggestions += 'Use React Testing Library. ';
          }
          
          report += `| ${file.relPath} | ${path.relative(process.cwd(), file.testFile)} | ${notes} | ${suggestions.trim() || 'N/A'} |\n`;
        });
        report += `\n`;
      } else {
        report += `These files have good test coverage with multiple test cases and assertions:\n\n`;
        filesWithLevel.forEach(file => {
          report += `- ${file.relPath}\n`;
        });
        report += `\n`;
      }
    }
  });
  
  // Test strategy recommendations
  report += `## Testing Strategy Recommendations\n\n`;
  report += `### Unit Testing\n\n`;
  report += `- **Components**: Use React Testing Library to test rendering, user interactions, and state updates\n`;
  report += `- **Hooks**: Use @testing-library/react-hooks to test custom hook behavior\n`;
  report += `- **Utils**: Use Jest to test utility functions with various inputs\n`;
  report += `- **Reducers**: Test all action types and state transitions\n\n`;
  
  report += `### Integration Testing\n\n`;
  report += `- Test component compositions and data flow between components\n`;
  report += `- Test form submissions and API interactions\n`;
  report += `- Test context providers with their consumers\n\n`;
  
  report += `### End-to-End Testing\n\n`;
  report += `- Consider adding Cypress or Playwright tests for critical user flows\n`;
  report += `- Focus on authentication, navigation, and key business logic\n\n`;
  
  report += `### Next Steps\n\n`;
  report += `1. Start by adding tests for uncovered components with high business value\n`;
  report += `2. Improve test quality for files with poor or minimal test coverage\n`;
  report += `3. Set up a coverage reporting tool for continuous monitoring\n`;
  report += `4. Consider implementing a test coverage threshold in CI/CD pipeline\n`;
  
  return report;
}

// Main function
function analyzeTestCoverage() {
  // Find source and test files
  const { sourceFiles, testFiles } = findSourceAndTestFiles();
  
  if (sourceFiles.length === 0) {
    console.log('No source files found.');
    return;
  }
  
  console.log(`Found ${sourceFiles.length} source files and ${testFiles.length} test files.`);
  
  // Analyze coverage
  console.log('Analyzing test coverage...');
  const basicCoverage = analyzeTestCoverage(sourceFiles, testFiles);
  
  // Analyze test quality for covered files
  console.log('Analyzing test quality...');
  const fullCoverage = analyzeTestQuality(basicCoverage.filter(f => f.hasCoverage));
  
  // Combine results
  const coverage = basicCoverage.map(file => {
    const qualityAnalysis = fullCoverage.find(f => f.sourceFile === file.sourceFile);
    return file.hasCoverage && qualityAnalysis ? qualityAnalysis : file;
  });
  
  // Generate report
  console.log('Generating test coverage report...');
  const report = generateReport(coverage);
  fs.writeFileSync(REPORT_PATH, report);
  
  // Calculate statistics for summary
  const totalFiles = coverage.length;
  const coveredFiles = coverage.filter(file => file.hasCoverage).length;
  const coverageRate = (coveredFiles / totalFiles * 100).toFixed(2);
  
  console.log(`\n✅ Analysis complete! Test coverage rate: ${coverageRate}% (${coveredFiles}/${totalFiles} files).`);
  console.log(`Test coverage report saved to: ${REPORT_PATH}`);
}

// Run the analysis
analyzeTestCoverage();
