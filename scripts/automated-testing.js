#!/usr/bin/env node

/**
 * Automated Testing Script
 * 
 * This script runs various tests to verify that code changes
 * don't break functionality:
 * 1. TypeScript type checking
 * 2. ESLint checks
 * 3. Build verification
 * 4. Unit tests
 * 
 * The script provides detailed error reporting and suggestions for fixes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🧪 Starting automated testing...\n');

// Function to run a test and capture output
async function runTest(command, description) {
  console.log(`Running ${description}...`);
  
  try {
    const { stdout, stderr } = await exec(command);
    console.log(`✅ ${description} passed!`);
    return { success: true, stdout, stderr };
  } catch (error) {
    console.error(`❌ ${description} failed!`);
    return { 
      success: false, 
      stdout: error.stdout || '', 
      stderr: error.stderr || '',
      error: error.message
    };
  }
}

// Function to parse TypeScript errors
function parseTypeErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('error TS')) {
      const errorMatch = line.match(/(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/);
      if (errorMatch) {
        errors.push({
          file: errorMatch[1],
          line: parseInt(errorMatch[2]),
          column: parseInt(errorMatch[3]),
          code: errorMatch[4],
          message: errorMatch[5]
        });
      }
    }
  }
  
  return errors;
}

// Function to parse ESLint errors
function parseESLintErrors(output) {
  const errors = [];
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('error') && !line.includes('0 errors')) {
      const errorMatch = line.match(/(.+):(\d+):(\d+):\s+(.+)/);
      if (errorMatch) {
        errors.push({
          file: errorMatch[1],
          line: parseInt(errorMatch[2]),
          column: parseInt(errorMatch[3]),
          message: errorMatch[4]
        });
      }
    }
  }
  
  return errors;
}

// Function to suggest fixes for TypeScript errors
function suggestTypeFixes(errors) {
  const suggestions = {};
  
  errors.forEach(error => {
    const key = `${error.file}:${error.line}`;
    if (!suggestions[key]) {
      suggestions[key] = [];
    }
    
    let suggestion = '';
    
    if (error.message.includes("Property 'tournament_type' does not exist on type")) {
      suggestion = "Import TournamentType enum and ensure proper typing: `tournament_type: TournamentType`";
    } else if (error.message.includes("Property 'game_format' does not exist on type")) {
      suggestion = "Import GameFormat enum and ensure proper typing: `game_format: GameFormat`";
    } else if (error.message.includes("Property 'status' does not exist on type")) {
      suggestion = "Import TournamentStatus enum and ensure proper typing: `status: TournamentStatus`";
    } else if (error.message.includes("Cannot find name")) {
      suggestion = `Import the missing type/component: \`import { ${error.message.match(/Cannot find name '(.+)'/)[1]} } from ...\``;
    } else if (error.message.includes("Type 'string' is not assignable to type")) {
      suggestion = "Use proper type casting or enum value instead of string literal";
    } else if (error.message.includes("Object is possibly 'undefined'")) {
      suggestion = "Add a null check using optional chaining (?.) or nullish coalescing (??)";
    } else {
      suggestion = "Review type definitions and ensure proper imports";
    }
    
    suggestions[key].push({
      error: error.message,
      suggestion
    });
  });
  
  return suggestions;
}

// Function to generate report
function generateTestReport(results) {
  let report = `# Automated Testing Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  // Overall status
  const allPassed = Object.values(results).every(r => r.success);
  report += `## Overall Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  // Summary table
  report += `| Test | Status | Issues |\n`;
  report += `| ---- | ------ | ------ |\n`;
  
  Object.entries(results).forEach(([test, result]) => {
    let issues = '0';
    
    if (test === 'typeCheck' && !result.success) {
      issues = result.typeErrors.length.toString();
    } else if (test === 'lint' && !result.success) {
      issues = result.lintErrors.length.toString();
    } else if (!result.success) {
      issues = 'See details';
    }
    
    report += `| ${test} | ${result.success ? '✅ PASSED' : '❌ FAILED'} | ${issues} |\n`;
  });
  
  report += '\n';
  
  // Detailed results
  if (!results.typeCheck.success) {
    report += `## TypeScript Errors\n\n`;
    
    Object.entries(results.typeCheck.suggestions).forEach(([location, issues]) => {
      report += `### ${location}\n\n`;
      
      issues.forEach(issue => {
        report += `- **Error:** ${issue.error}\n`;
        report += `  - **Suggestion:** ${issue.suggestion}\n\n`;
      });
    });
  }
  
  if (!results.lint.success) {
    report += `## ESLint Errors\n\n`;
    
    results.lint.lintErrors.forEach(error => {
      report += `- **${error.file}:${error.line}:${error.column}**: ${error.message}\n`;
    });
    
    report += '\n';
  }
  
  if (!results.build.success) {
    report += `## Build Errors\n\n`;
    report += '```\n';
    report += results.build.stderr || results.build.stdout || results.build.error;
    report += '\n```\n\n';
  }
  
  if (!results.test.success) {
    report += `## Test Failures\n\n`;
    report += '```\n';
    report += results.test.stderr || results.test.stdout || results.test.error;
    report += '\n```\n\n';
  }
  
  // Next steps
  report += `## Next Steps\n\n`;
  
  if (allPassed) {
    report += `✅ All tests passed! The code changes look good and can be committed.\n`;
  } else {
    report += `Please address the errors above before committing changes. Here's a suggested approach:\n\n`;
    
    if (!results.typeCheck.success) {
      report += `1. Fix TypeScript errors first - these often highlight actual code problems\n`;
    }
    
    if (!results.lint.success) {
      report += `2. Address ESLint issues to ensure code quality and consistency\n`;
    }
    
    if (!results.build.success) {
      report += `3. Fix build errors to ensure the app compiles correctly\n`;
    }
    
    if (!results.test.success) {
      report += `4. Address test failures to ensure functionality is preserved\n`;
    }
  }
  
  return report;
}

// Main function
async function runTests() {
  const results = {};
  
  // Run TypeScript type checking
  results.typeCheck = await runTest('npm run type-check', 'TypeScript type checking');
  if (!results.typeCheck.success) {
    results.typeCheck.typeErrors = parseTypeErrors(results.typeCheck.stdout);
    results.typeCheck.suggestions = suggestTypeFixes(results.typeCheck.typeErrors);
  }
  
  // Run ESLint
  results.lint = await runTest('npm run lint', 'ESLint checking');
  if (!results.lint.success) {
    results.lint.lintErrors = parseESLintErrors(results.lint.stdout || results.lint.stderr);
  }
  
  // Run build
  results.build = await runTest('npm run build:dev', 'Development build');
  
  // Run tests
  results.test = await runTest('npm test -- --passWithNoTests', 'Unit tests');
  
  // Generate report
  const report = generateTestReport(results);
  const reportPath = path.join(process.cwd(), 'test-results.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Test report generated at: ${reportPath}`);
  
  // Log final status
  const allPassed = Object.values(results).every(r => r.success);
  if (allPassed) {
    console.log('\n🎉 All tests passed! The code changes look good and can be committed.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the report for details.');
  }
  
  return results;
}

runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
