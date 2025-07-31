#!/usr/bin/env node

/**
 * VNPAY Integration Installation Script
 * 
 * This script helps set up the VNPAY payment gateway integration
 * by creating necessary files and configurations.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 VNPAY Payment Gateway Integration Setup');
console.log('==========================================\n');

// Check if required files exist
const requiredFiles = [
  'src/integrations/vnpay/vnpay-payment-gateway.js',
  'demo-server.js',
  'test-vnpay.js'
];

console.log('📋 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
  }
});

// Create .env file if it doesn't exist
const envFile = '.env';
if (!fs.existsSync(envFile)) {
  console.log('\n📝 Creating .env file...');
  const envContent = `# VNPAY Payment Gateway Configuration
VNP_TMN_CODE=T53WMA78
VNP_HASH_SECRET=M1TOK8Z2U7KIPX67FDFBSXTPHGSEFHZ9
VNP_RETURN_URL=http://localhost:3001/api/webhooks/vnpay-return
VNP_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_IPN_URL=http://localhost:3001/api/webhooks/vnpay-ipn

# Server Configuration
PORT=3001
NODE_ENV=development
`;
  
  fs.writeFileSync(envFile, envContent);
  console.log('   ✅ .env file created');
} else {
  console.log('   ✅ .env file already exists');
}

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = ['express', 'crypto', 'moment', 'dotenv', 'querystring', 'axios'];
  
  const missingDeps = requiredDeps.filter(dep => {
    return !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep];
  });
  
  if (missingDeps.length > 0) {
    console.log(`   ⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
    console.log('   Run: npm install ' + missingDeps.join(' '));
  } else {
    console.log('   ✅ All required dependencies found');
  }
} else {
  console.log('   ❌ package.json not found');
}

// Create installation instructions
console.log('\n📖 Installation Instructions:');
console.log('1. Install dependencies:');
console.log('   npm install express crypto moment dotenv querystring axios cors helmet morgan');
console.log('');
console.log('2. Start the demo server:');
console.log('   node demo-server.js');
console.log('');
console.log('3. Open your browser to:');
console.log('   http://localhost:3001');
console.log('');
console.log('4. Test the payment flow:');
console.log('   - Create a payment using the form');
console.log('   - Use test card: 4524 0418 7644 5035');
console.log('   - Name: VÕ LONG SANG, Expiry: 10/27, OTP: 160922');
console.log('');
console.log('5. Check the logs for payment processing');
console.log('');

// Create quick test script
const testScript = `
// Quick test script
const { testCreatePayment } = require('./test-vnpay.js');

console.log('Running quick VNPAY test...');
const result = testCreatePayment();
console.log('Payment URL:', result.paymentUrl);
`;

fs.writeFileSync('quick-test.js', testScript);
console.log('✅ Quick test script created: quick-test.js');
console.log('   Run: node quick-test.js');

console.log('\n🎉 Setup complete!');
console.log('\n📚 Next steps:');
console.log('1. Review the VNPAY_INTEGRATION_README.md for detailed documentation');
console.log('2. Test the integration with the demo server');
console.log('3. Integrate into your main application');
console.log('4. Configure production environment variables');
console.log('\n🔗 Useful links:');
console.log('- VNPAY Sandbox: https://sandbox.vnpayment.vn/');
console.log('- VNPAY Documentation: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop'); 