const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import VNPAY payment gateway router
const vnpayRouter = require('./src/integrations/vnpay/vnpay-payment-gateway');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Trust proxy for accurate IP detection
app.set('trust proxy', true);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount VNPAY payment routes
app.use('/api/payments', vnpayRouter);
app.use('/api/webhooks', vnpayRouter);

// Demo endpoints for testing
app.get('/api/demo/create-payment', (req, res) => {
  res.json({
    message: 'Use POST /api/payments/create-vnpay to create a payment',
    example: {
      method: 'POST',
      url: '/api/payments/create-vnpay',
      body: {
        orderId: 'ORDER_' + Date.now(),
        amount: 100000, // 100,000 VND
        orderInfo: 'Test payment for order',
        orderType: 'billpayment'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 VNPAY Payment endpoints:`);
  console.log(`   - Create payment: POST http://localhost:${PORT}/api/payments/create-vnpay`);
  console.log(`   - Payment return: GET http://localhost:${PORT}/api/webhooks/vnpay-return`);
  console.log(`   - Payment IPN: GET http://localhost:${PORT}/api/webhooks/vnpay-ipn`);
  console.log(`   - Payment status: GET http://localhost:${PORT}/api/payments/vnpay-status/:orderId`);
  console.log(`   - Demo: GET http://localhost:${PORT}/api/demo/create-payment`);
  console.log('');
  console.log('🔧 VNPAY Test Configuration:');
  console.log(`   - TMN Code: ${process.env.VNP_TMN_CODE || 'T53WMA78'}`);
  console.log(`   - Payment URL: ${process.env.VNP_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'}`);
  console.log('');
  console.log('💳 Test Card Details (VCB Bank):');
  console.log('   - Card Number: 4524 0418 7644 5035');
  console.log('   - Name: VÕ LONG SANG');
  console.log('   - Expiry: 10/27');
  console.log('   - OTP: 160922');
});

module.exports = app; 