#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Testing report creation...');

try {
  // Try to write to the current working directory
  const testPath = path.join(process.cwd(), 'test-report.txt');
  fs.writeFileSync(testPath, 'This is a test report');
  console.log(`Successfully wrote to ${testPath}`);
  
  // Check if the file exists
  if (fs.existsSync(testPath)) {
    console.log('File exists after writing');
    
    // Try to read it back
    const content = fs.readFileSync(testPath, 'utf8');
    console.log(`File content: ${content}`);
  } else {
    console.log('File does not exist after writing!');
  }
} catch (error) {
  console.error('Error during test:', error);
}
