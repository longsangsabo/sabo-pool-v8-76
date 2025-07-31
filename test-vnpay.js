/**
 * VNPAY Payment Gateway Test Script
 * 
 * This script demonstrates how to test the VNPAY payment integration
 * without running the full server.
 */

const crypto = require('crypto');
const moment = require('moment');
const querystring = require('querystring');

// Updated test configuration
const TEST_CONFIG = {
  VNP_TMN_CODE: 'T53WMA78',
  VNP_HASH_SECRET: 'M1TOK8Z2U7KIPX67FDFBSXTPHGSEFHZ9',
  VNP_PAYMENT_URL: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  VNP_RETURN_URL: 'https://your-domain.com/api/webhooks/vnpay-return'
};

/**
 * Create VNPAY secure hash
 */
function createVNPAYHash(params, secretKey) {
  // Sort parameters by key
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});

  // Convert to query string format
  const queryString = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');

  // Create HMAC SHA512 hash
  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(queryString);
  
  return hmac.digest('hex');
}

/**
 * Test payment creation
 */
function testCreatePayment() {
  console.log('🧪 Testing VNPAY Payment Creation...\n');

  const orderId = 'TEST_ORDER_' + Date.now();
  const amount = 100000; // 100,000 VND
  const orderInfo = 'Test payment for Sabo Pool Arena';
  const orderType = 'billpayment';

  // Build VNPAY parameters
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: TEST_CONFIG.VNP_TMN_CODE,
    vnp_Amount: Math.round(amount * 100), // Convert to smallest currency unit
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_ReturnUrl: TEST_CONFIG.VNP_RETURN_URL,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
    vnp_Locale: 'vn'
  };

  // Create secure hash
  const secureHash = createVNPAYHash(params, TEST_CONFIG.VNP_HASH_SECRET);
  params.vnp_SecureHash = secureHash;

  // Build payment URL
  const paymentUrl = `${TEST_CONFIG.VNP_PAYMENT_URL}?${querystring.stringify(params)}`;

  console.log('📋 Payment Parameters:');
  console.log(JSON.stringify(params, null, 2));
  console.log('\n🔗 Payment URL:');
  console.log(paymentUrl);
  console.log('\n💳 Test Card Details:');
  console.log('   Card Number: 4524 0418 7644 5035');
  console.log('   Name: VÕ LONG SANG');
  console.log('   Expiry: 10/27');
  console.log('   OTP: 160922');

  return { orderId, amount, paymentUrl, params };
}

/**
 * Test hash verification
 */
function testHashVerification(originalParams) {
  console.log('\n🔍 Testing Hash Verification...\n');

  // Simulate received parameters from VNPAY
  const receivedParams = { ...originalParams };
  const receivedHash = receivedParams.vnp_SecureHash;

  // Remove hash for verification
  delete receivedParams.vnp_SecureHash;

  // Recalculate hash
  const calculatedHash = createVNPAYHash(receivedParams, TEST_CONFIG.VNP_HASH_SECRET);

  // Verify hash
  const isValid = calculatedHash.toLowerCase() === receivedHash.toLowerCase();

  console.log('📊 Hash Verification Results:');
  console.log(`   Received Hash: ${receivedHash}`);
  console.log(`   Calculated Hash: ${calculatedHash}`);
  console.log(`   Verification: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);

  return isValid;
}

/**
 * Test response code handling
 */
function testResponseCodes() {
  console.log('\n📋 Testing Response Code Handling...\n');

  const responseCodes = {
    '00': 'Success',
    '07': 'Invalid amount',
    '09': 'Invalid order information',
    '13': 'Invalid order type',
    '24': 'Customer cancelled',
    '51': 'Insufficient balance',
    '65': 'Exceeded daily limit',
    '75': 'Bank maintenance',
    '79': 'Invalid payment information',
    '99': 'Unknown error'
  };

  console.log('📊 VNPAY Response Codes:');
  Object.entries(responseCodes).forEach(([code, description]) => {
    console.log(`   ${code}: ${description}`);
  });
}

/**
 * Test different payment scenarios
 */
function testPaymentScenarios() {
  console.log('\n🎯 Testing Payment Scenarios...\n');

  const scenarios = [
    {
      name: 'Small Payment',
      amount: 50000,
      orderInfo: 'Small test payment'
    },
    {
      name: 'Large Payment',
      amount: 1000000,
      orderInfo: 'Large test payment'
    },
    {
      name: 'Membership Payment',
      amount: 500000,
      orderInfo: 'Premium membership upgrade'
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}. ${scenario.name}:`);
    console.log(`   Amount: ${scenario.amount.toLocaleString()} VND`);
    console.log(`   Description: ${scenario.orderInfo}`);
    
    const orderId = `TEST_${scenario.name.toUpperCase()}_${Date.now()}`;
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: TEST_CONFIG.VNP_TMN_CODE,
      vnp_Amount: Math.round(scenario.amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: scenario.orderInfo,
      vnp_OrderType: 'billpayment',
      vnp_ReturnUrl: TEST_CONFIG.VNP_RETURN_URL,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_Locale: 'vn'
    };

    const secureHash = createVNPAYHash(params, TEST_CONFIG.VNP_HASH_SECRET);
    params.vnp_SecureHash = secureHash;

    console.log(`   Order ID: ${orderId}`);
    console.log(`   Hash: ${secureHash.substring(0, 16)}...`);
    console.log('');
  });
}

/**
 * Main test function
 */
function runTests() {
  console.log('🚀 VNPAY Payment Gateway Test Suite');
  console.log('=====================================\n');

  // Test 1: Payment Creation
  const paymentResult = testCreatePayment();

  // Test 2: Hash Verification
  testHashVerification(paymentResult.params);

  // Test 3: Response Codes
  testResponseCodes();

  // Test 4: Payment Scenarios
  testPaymentScenarios();

  console.log('\n✅ All tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Copy the payment URL above');
  console.log('2. Open it in your browser');
  console.log('3. Use the test card details to complete payment');
  console.log('4. Check the return URL handling');
  console.log('5. Verify IPN notifications');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testCreatePayment,
  testHashVerification,
  testResponseCodes,
  testPaymentScenarios,
  createVNPAYHash
}; 