#!/usr/bin/env node

/**
 * Master Workflow Script
 * 
 * This script orchestrates the entire automated workflow:
 * 1. Analysis phase - run all analysis tools
 * 2. Implementation phase - apply automated changes
 * 3. Testing phase - verify changes don't break anything
 * 4. Reporting phase - generate a comprehensive summary
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

console.log('🚀 Starting master automation workflow...\n');

// Make scripts executable
function makeScriptsExecutable() {
  const scriptsDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(scriptsDir)) {
    console.error('❌ Scripts directory not found!');
    process.exit(1);
  }
  
  try {
    execSync(`chmod +x ${scriptsDir}/*.js`);
    console.log('✅ Made scripts executable');
  } catch (error) {
    console.error('❌ Failed to make scripts executable:', error.message);
  }
}

// Run a script and wait for completion
async function runScript(scriptPath, description) {
  console.log(`\n🔄 Running ${description}...`);
  
  try {
    const { stdout, stderr } = await exec(`node ${scriptPath}`);
    console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    return false;
  }
}

// Generate workflow summary
function generateWorkflowSummary(phases) {
  let summary = `# Automated Workflow Summary\n\n`;
  summary += `Date: ${new Date().toISOString()}\n\n`;
  
  // Summary table
  summary += `## Phase Results\n\n`;
  summary += `| Phase | Status | Details |\n`;
  summary += `| ----- | ------ | ------- |\n`;
  
  Object.entries(phases).forEach(([phase, result]) => {
    summary += `| ${phase} | ${result.success ? '✅ PASSED' : '❌ FAILED'} | ${result.message} |\n`;
  });
  
  summary += '\n';
  
  // Reports section
  summary += `## Available Reports\n\n`;
  summary += `- [Code Analysis Summary](./CODE_ANALYSIS_SUMMARY.md)\n`;
  
  if (fs.existsSync(path.join(process.cwd(), 'reports'))) {
    const reportFiles = fs.readdirSync(path.join(process.cwd(), 'reports'));
    reportFiles.forEach(file => {
      summary += `- [${file}](./reports/${file})\n`;
    });
  }
  
  if (fs.existsSync(path.join(process.cwd(), 'test-results.md'))) {
    summary += `- [Test Results](./test-results.md)\n`;
  }
  
  summary += '\n';
  
  // Next steps
  summary += `## Next Steps\n\n`;
  
  const allPassed = Object.values(phases).every(p => p.success);
  
  if (allPassed) {
    summary += `✅ All phases completed successfully! The code has been analyzed, improved, and tested.\n\n`;
    summary += `Recommended next actions:\n\n`;
    summary += `1. Review the consolidated reports\n`;
    summary += `2. Manually inspect critical areas of the code\n`;
    summary += `3. Commit the changes\n`;
  } else {
    summary += `⚠️ Some phases encountered issues. Please review the detailed reports and address any problems.\n\n`;
    summary += `Recommended next actions:\n\n`;
    
    if (!phases.analysis.success) {
      summary += `1. Fix issues with the analysis scripts\n`;
    }
    
    if (!phases.implementation.success) {
      summary += `2. Review and manually apply the changes that failed to apply automatically\n`;
    }
    
    if (!phases.testing.success) {
      summary += `3. Address the test failures reported in test-results.md\n`;
    }
  }
  
  return summary;
}

// Main workflow function
async function runWorkflow() {
  const phases = {
    analysis: { success: false, message: '' },
    implementation: { success: false, message: '' },
    testing: { success: false, message: '' },
    reporting: { success: false, message: '' }
  };
  
  // Make scripts executable
  makeScriptsExecutable();
  
  // Phase 1: Analysis
  console.log('\n📊 PHASE 1: ANALYSIS\n');
  const analysisSuccess = await runScript(
    path.join(process.cwd(), 'scripts', 'master-analysis.js'),
    'Code analysis'
  );
  
  phases.analysis.success = analysisSuccess;
  phases.analysis.message = analysisSuccess 
    ? 'Successfully analyzed codebase and generated reports'
    : 'Encountered issues during analysis';
  
  if (!analysisSuccess) {
    console.warn('⚠️ Analysis phase encountered issues, but continuing workflow...');
  }
  
  // Phase 2: Implementation
  console.log('\n🛠️ PHASE 2: IMPLEMENTATION\n');
  const implementationSuccess = await runScript(
    path.join(process.cwd(), 'scripts', 'auto-implementation.js'),
    'Auto-implementation'
  );
  
  phases.implementation.success = implementationSuccess;
  phases.implementation.message = implementationSuccess 
    ? 'Successfully applied automated changes'
    : 'Encountered issues applying changes';
  
  if (!implementationSuccess) {
    console.warn('⚠️ Implementation phase encountered issues, but continuing workflow...');
  }
  
  // Phase 3: Testing
  console.log('\n🧪 PHASE 3: TESTING\n');
  const testingSuccess = await runScript(
    path.join(process.cwd(), 'scripts', 'automated-testing.js'),
    'Automated testing'
  );
  
  phases.testing.success = testingSuccess;
  phases.testing.message = testingSuccess 
    ? 'All tests passed successfully'
    : 'Some tests failed, see test-results.md for details';
  
  // Phase 4: Generate workflow summary
  console.log('\n📝 PHASE 4: REPORTING\n');
  
  try {
    const summary = generateWorkflowSummary(phases);
    const summaryPath = path.join(process.cwd(), 'WORKFLOW_SUMMARY.md');
    fs.writeFileSync(summaryPath, summary);
    
    console.log(`✅ Generated workflow summary at: ${summaryPath}`);
    phases.reporting.success = true;
    phases.reporting.message = 'Successfully generated workflow summary';
  } catch (error) {
    console.error('❌ Failed to generate workflow summary:', error.message);
    phases.reporting.success = false;
    phases.reporting.message = 'Failed to generate workflow summary';
  }
  
  // Final output
  const allPassed = Object.values(phases).every(p => p.success);
  
  console.log('\n==================================');
  console.log(`🏁 WORKFLOW ${allPassed ? 'COMPLETED SUCCESSFULLY' : 'COMPLETED WITH ISSUES'}`);
  console.log('==================================\n');
  
  Object.entries(phases).forEach(([phase, result]) => {
    console.log(`${result.success ? '✅' : '❌'} ${phase}: ${result.message}`);
  });
  
  console.log('\nPlease check WORKFLOW_SUMMARY.md for more details and next steps.');
}

runWorkflow().catch(error => {
  console.error('Workflow error:', error);
  process.exit(1);
});
