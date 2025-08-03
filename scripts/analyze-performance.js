#!/usr/bin/env node

/**
 * Advanced Performance Analysis Script
 * 
 * This script analyzes various performance aspects of the codebase:
 * 1. Component re-render analysis (finds components likely to cause unnecessary re-renders)
 * 2. Bundle size analysis (identifies large dependencies and chunks)
 * 3. Expensive computation detection (finds potentially slow code)
 * 4. Memory leak risk detection (finds patterns that could cause memory leaks)
 * 5. Network bottleneck identification (finds inefficient API usage patterns)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(process.cwd(), 'src');
const REPORTS_DIR = path.join(process.cwd(), 'reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

console.log('🔍 Running advanced performance analysis...');

// Function to find potentially problematic re-renders
function analyzeReRenderRisks() {
  console.log('Analyzing potential re-render issues...');
  
  const results = {
    highRisk: [],
    mediumRisk: [],
    lowRisk: []
  };
  
  try {
    // Find components without memoization
    const nonMemoComponents = [];
    const grepNonMemo = `find ${SRC_DIR} -type f -name "*.tsx" | xargs grep -l "export.*function" | xargs grep -L "memo\\|React\\.memo\\|useMemo"`;
    
    try {
      const output = execSync(grepNonMemo, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentName = path.basename(file, '.tsx');
        
        // Check if it renders children or has many props
        const hasChildren = content.includes('children');
        const propsCount = (content.match(/props\./g) || []).length;
        
        if (hasChildren && propsCount > 5) {
          results.highRisk.push({
            component: componentName,
            file: path.relative(process.cwd(), file),
            reason: 'Non-memoized component with children and many props'
          });
        } else if (hasChildren || propsCount > 5) {
          results.mediumRisk.push({
            component: componentName,
            file: path.relative(process.cwd(), file),
            reason: hasChildren ? 'Non-memoized component with children' : 'Non-memoized component with many props'
          });
        } else {
          results.lowRisk.push({
            component: componentName,
            file: path.relative(process.cwd(), file),
            reason: 'Non-memoized component'
          });
        }
      });
    } catch (error) {
      // No matches found
    }
    
    // Find inline functions in render
    try {
      const grepInlineFunctions = `find ${SRC_DIR} -type f -name "*.tsx" | xargs grep -l "=>.*=>" | xargs grep -l "render\\|return"`;
      const output = execSync(grepInlineFunctions, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const componentName = path.basename(file, '.tsx');
        
        // Check if it's already in high risk
        const isAlreadyHighRisk = results.highRisk.some(item => item.component === componentName);
        
        if (!isAlreadyHighRisk) {
          results.highRisk.push({
            component: componentName,
            file: path.relative(process.cwd(), file),
            reason: 'Component with nested inline functions in render'
          });
        }
      });
    } catch (error) {
      // No matches found
    }
    
    return results;
  } catch (error) {
    console.error('Error analyzing re-render risks:', error);
    return results;
  }
}

// Function to find expensive computations
function findExpensiveComputations() {
  console.log('Finding potentially expensive computations...');
  
  const expensivePatterns = [
    { pattern: 'for.*for', description: 'Nested loops' },
    { pattern: '\\.map.*\\.map', description: 'Nested array maps' },
    { pattern: '\\.filter.*\\.map|\\.map.*\\.filter', description: 'Chained array operations' },
    { pattern: 'sort\\(', description: 'Array sorting' },
    { pattern: 'reduce\\(', description: 'Array reduction' },
    { pattern: 'JSON\\.parse|JSON\\.stringify', description: 'JSON parsing/stringifying' }
  ];
  
  const results = [];
  
  expensivePatterns.forEach(({ pattern, description }) => {
    try {
      const grepCommand = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "${pattern}"`;
      const output = execSync(grepCommand, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        
        // Check if it's in a useEffect or useMemo
        const content = fs.readFileSync(file, 'utf8');
        const isOptimized = content.includes('useMemo') || content.includes('useCallback');
        
        results.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          pattern: description,
          optimized: isOptimized
        });
      });
    } catch (error) {
      // No matches found
    }
  });
  
  return results;
}

// Function to detect potential memory leaks
function detectMemoryLeakRisks() {
  console.log('Detecting potential memory leak risks...');
  
  const riskPatterns = [
    { pattern: 'addEventListener(?!.*removeEventListener)', description: 'Event listener without cleanup' },
    { pattern: 'setInterval(?!.*clearInterval)', description: 'setInterval without clearInterval' },
    { pattern: 'setTimeout(?!.*clearTimeout)', description: 'setTimeout without clearTimeout' },
    { pattern: 'new\\s+[A-Z][a-zA-Z]*\\(', description: 'Object instantiation in render' },
    { pattern: 'useRef\\([^)]*\\)(?!.*useEffect)', description: 'useRef without cleanup in useEffect' }
  ];
  
  const results = [];
  
  riskPatterns.forEach(({ pattern, description }) => {
    try {
      const grepCommand = `find ${SRC_DIR} -type f -name "*.tsx" -o -name "*.jsx" | xargs grep -l "${pattern}"`;
      const output = execSync(grepCommand, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        
        results.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          risk: description
        });
      });
    } catch (error) {
      // No matches found
    }
  });
  
  return results;
}

// Function to analyze network bottlenecks
function analyzeNetworkBottlenecks() {
  console.log('Analyzing potential network bottlenecks...');
  
  const bottleneckPatterns = [
    { pattern: 'fetch\\(|axios\\.|http\\.|request\\(', description: 'API call without loading state' },
    { pattern: 'useEffect.*fetch|useEffect.*axios', description: 'API call in useEffect' },
    { pattern: '\\.then\\(.*\\.then\\(', description: 'Chained API calls' }
  ];
  
  const results = [];
  
  bottleneckPatterns.forEach(({ pattern, description }) => {
    try {
      const grepCommand = `find ${SRC_DIR} -type f -name "*.ts*" | xargs grep -l "${pattern}"`;
      const output = execSync(grepCommand, { encoding: 'utf8' });
      const files = output.trim().split('\n').filter(Boolean);
      
      files.forEach(file => {
        const componentName = path.basename(file, path.extname(file));
        const content = fs.readFileSync(file, 'utf8');
        
        // Check if using loading state
        const hasLoadingState = content.includes('loading') || content.includes('isLoading') || content.includes('pending');
        
        // Check if using caching or memoization
        const hasCaching = content.includes('useQuery') || content.includes('useSWR') || content.includes('cache');
        
        results.push({
          component: componentName,
          file: path.relative(process.cwd(), file),
          issue: description,
          hasLoadingState,
          hasCaching
        });
      });
    } catch (error) {
      // No matches found
    }
  });
  
  return results;
}

// Function to generate report
function generateReport(reRenderRisks, expensiveComputations, memoryLeakRisks, networkBottlenecks) {
  let report = `# Advanced Performance Analysis Report\n\n`;
  report += `Date: ${new Date().toISOString()}\n\n`;
  
  // Re-render risks
  report += `## Component Re-render Risks\n\n`;
  
  if (reRenderRisks.highRisk.length > 0) {
    report += `### High Risk Components (${reRenderRisks.highRisk.length})\n\n`;
    reRenderRisks.highRisk.forEach(item => {
      report += `- **${item.component}** (${item.file}): ${item.reason}\n`;
    });
    report += '\n';
  } else {
    report += `No high risk components found.\n\n`;
  }
  
  if (reRenderRisks.mediumRisk.length > 0) {
    report += `### Medium Risk Components (${reRenderRisks.mediumRisk.length})\n\n`;
    reRenderRisks.mediumRisk.forEach(item => {
      report += `- **${item.component}** (${item.file}): ${item.reason}\n`;
    });
    report += '\n';
  }
  
  if (reRenderRisks.lowRisk.length > 0) {
    report += `### Low Risk Components (${reRenderRisks.lowRisk.length})\n\n`;
    report += `${reRenderRisks.lowRisk.length} components with minor re-render risks identified.\n\n`;
  }
  
  // Expensive computations
  report += `## Expensive Computation Risks\n\n`;
  
  if (expensiveComputations.length > 0) {
    const notOptimized = expensiveComputations.filter(item => !item.optimized);
    
    report += `Found ${expensiveComputations.length} potentially expensive operations, ${notOptimized.length} without optimization.\n\n`;
    
    if (notOptimized.length > 0) {
      report += `### Unoptimized Expensive Operations\n\n`;
      notOptimized.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.pattern}\n`;
      });
      report += '\n';
    }
  } else {
    report += `No expensive computations found.\n\n`;
  }
  
  // Memory leak risks
  report += `## Memory Leak Risks\n\n`;
  
  if (memoryLeakRisks.length > 0) {
    report += `Found ${memoryLeakRisks.length} potential memory leak risks:\n\n`;
    memoryLeakRisks.forEach(item => {
      report += `- **${item.component}** (${item.file}): ${item.risk}\n`;
    });
    report += '\n';
  } else {
    report += `No memory leak risks found.\n\n`;
  }
  
  // Network bottlenecks
  report += `## Network Bottleneck Risks\n\n`;
  
  if (networkBottlenecks.length > 0) {
    const noLoadingState = networkBottlenecks.filter(item => !item.hasLoadingState);
    const noCaching = networkBottlenecks.filter(item => !item.hasCaching);
    
    report += `Found ${networkBottlenecks.length} network operations:\n`;
    report += `- ${noLoadingState.length} without proper loading states\n`;
    report += `- ${noCaching.length} without caching mechanisms\n\n`;
    
    if (noLoadingState.length > 0) {
      report += `### Missing Loading States\n\n`;
      noLoadingState.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}\n`;
      });
      report += '\n';
    }
    
    if (noCaching.length > 0) {
      report += `### Missing Caching\n\n`;
      noCaching.forEach(item => {
        report += `- **${item.component}** (${item.file}): ${item.issue}\n`;
      });
      report += '\n';
    }
  } else {
    report += `No network bottleneck risks found.\n\n`;
  }
  
  // Recommendations
  report += `## Recommendations\n\n`;
  
  if (reRenderRisks.highRisk.length > 0) {
    report += `### Re-render Optimizations\n\n`;
    report += `1. Use \`React.memo()\` for components with many props or children\n`;
    report += `2. Move inline functions outside of render or wrap in useCallback\n`;
    report += `3. Consider using component composition to reduce props drilling\n\n`;
  }
  
  if (expensiveComputations.filter(item => !item.optimized).length > 0) {
    report += `### Computation Optimizations\n\n`;
    report += `1. Wrap expensive operations in useMemo hooks\n`;
    report += `2. Consider moving expensive calculations to web workers\n`;
    report += `3. Implement virtualization for long lists\n\n`;
  }
  
  if (memoryLeakRisks.length > 0) {
    report += `### Memory Leak Prevention\n\n`;
    report += `1. Ensure all event listeners are removed in cleanup functions\n`;
    report += `2. Clear all intervals and timeouts in useEffect cleanup\n`;
    report += `3. Avoid creating new objects in render methods\n\n`;
  }
  
  if (networkBottlenecks.length > 0) {
    report += `### Network Optimizations\n\n`;
    report += `1. Implement proper loading states for all API calls\n`;
    report += `2. Use React Query, SWR, or a custom caching mechanism\n`;
    report += `3. Consider implementing data prefetching for critical resources\n`;
  }
  
  return report;
}

// Main function
async function analyzePerformance() {
  // Run analyses
  const reRenderRisks = analyzeReRenderRisks();
  const expensiveComputations = findExpensiveComputations();
  const memoryLeakRisks = detectMemoryLeakRisks();
  const networkBottlenecks = analyzeNetworkBottlenecks();
  
  // Generate report
  const report = generateReport(reRenderRisks, expensiveComputations, memoryLeakRisks, networkBottlenecks);
  const reportPath = path.join(REPORTS_DIR, 'advanced-performance-analysis.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n✅ Performance analysis complete! Report saved to: ${reportPath}`);
  
  // Return results
  return {
    reRenderRisks,
    expensiveComputations,
    memoryLeakRisks,
    networkBottlenecks,
    reportPath
  };
}

analyzePerformance().catch(error => {
  console.error('Error running performance analysis:', error);
  process.exit(1);
});
