#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('Creating test report in scripts directory...');
const testPath = path.join(__dirname, 'test-report.txt');

try {
  fs.writeFileSync(testPath, 'Test content');
  console.log(`Successfully wrote to ${testPath}`);
  console.log(`File exists: ${fs.existsSync(testPath)}`);
} catch (error) {
  console.error('Error:', error);
}
