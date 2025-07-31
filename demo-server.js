const express = require('express');
const crypto = require('crypto');
const moment = require('moment');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// VNPAY Configuration
const VNPAY_CONFIG = {
  TMN_CODE: process.env.VNP_TMN_CODE || 'T53WMA78',
  HASH_SECRET: process.env.VNP_HASH_SECRET || 'M1TOK8Z2U7KIPX67FDFBSXTPHGSEFHZ9',
  PAYMENT_URL: process.env.VNP_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  RETURN_URL: process.env.VNP_RETURN_URL || `http://localhost:${PORT}/api/webhooks/vnpay-return`,
  IPN_URL: process.env.VNP_IPN_URL || `http://localhost:${PORT}/api/webhooks/vnpay-ipn`
};

// Utility functions
function createVNPAYHash(params, secretKey) {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});

  const queryString = Object.keys(sortedParams)
    .map(key => `${key}=${sortedParams[key]}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(queryString);
  
  return hmac.digest('hex');
}

function verifyVNPAYHash(params, receivedHash, secretKey) {
  const paramsForVerification = { ...params };
  delete paramsForVerification.vnp_SecureHash;

  const calculatedHash = createVNPAYHash(paramsForVerification, secretKey);
  return calculatedHash.toLowerCase() === receivedHash.toLowerCase();
}

// Demo homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>VNPAY Payment Demo</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            .button:hover { background: #0056b3; }
            .form-group { margin: 10px 0; }
            label { display: block; margin-bottom: 5px; }
            input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            .test-card { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>🧪 VNPAY Payment Gateway Demo</h1>
        
        <div class="container">
            <h2>Create Payment</h2>
            <form id="paymentForm">
                <div class="form-group">
                    <label for="amount">Amount (VND):</label>
                    <input type="number" id="amount" value="100000" min="1000" required>
                </div>
                <div class="form-group">
                    <label for="orderInfo">Order Description:</label>
                    <input type="text" id="orderInfo" value="Test payment for Sabo Pool Arena" required>
                </div>
                <div class="form-group">
                    <label for="orderType">Order Type:</label>
                    <select id="orderType">
                        <option value="billpayment">Bill Payment</option>
                        <option value="topup">Top Up</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <button type="submit" class="button">Create Payment</button>
            </form>
        </div>

        <div class="container">
            <h2>💳 Test Card Details</h2>
            <div class="test-card">
                <strong>VCB Bank Test Card:</strong><br>
                Card Number: 4524 0418 7644 5035<br>
                Name: VÕ LONG SANG<br>
                Expiry: 10/27<br>
                OTP: 160922
            </div>
        </div>

        <div class="container">
            <h2>📊 API Endpoints</h2>
            <ul>
                <li><strong>POST</strong> /api/payments/create-vnpay - Create payment</li>
                <li><strong>GET</strong> /api/webhooks/vnpay-return - Payment return</li>
                <li><strong>GET</strong> /api/webhooks/vnpay-ipn - Payment IPN</li>
                <li><strong>GET</strong> /api/payments/vnpay-status/:orderId - Check status</li>
            </ul>
        </div>

        <script>
            document.getElementById('paymentForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    orderId: 'ORDER_' + Date.now(),
                    amount: parseInt(document.getElementById('amount').value),
                    orderInfo: document.getElementById('orderInfo').value,
                    orderType: document.getElementById('orderType').value
                };

                try {
                    const response = await fetch('/api/payments/create-vnpay', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(formData)
                    });

                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Payment URL generated! Redirecting to VNPAY...');
                        window.location.href = result.paymentUrl;
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (error) {
                    alert('Error creating payment: ' + error.message);
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Create payment endpoint
app.post('/api/payments/create-vnpay', (req, res) => {
  try {
    const { orderId, amount, orderInfo, orderType } = req.body;

    if (!orderId || !amount || !orderInfo || !orderType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: VNPAY_CONFIG.TMN_CODE,
      vnp_Amount: Math.round(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_ReturnUrl: VNPAY_CONFIG.RETURN_URL,
      vnp_IpAddr: req.ip || '127.0.0.1',
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_Locale: 'vn'
    };

    const secureHash = createVNPAYHash(params, VNPAY_CONFIG.HASH_SECRET);
    params.vnp_SecureHash = secureHash;

    const paymentUrl = `${VNPAY_CONFIG.PAYMENT_URL}?${querystring.stringify(params)}`;

    console.log(`Payment created: ${orderId}, Amount: ${amount} VND`);

    res.json({
      success: true,
      paymentUrl: paymentUrl,
      orderId: orderId,
      amount: amount,
      message: 'Payment URL generated successfully'
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment'
    });
  }
});

// Payment return handler
app.get('/api/webhooks/vnpay-return', (req, res) => {
  try {
    const queryParams = req.query;
    const receivedHash = queryParams.vnp_SecureHash;

    if (!receivedHash) {
      return res.status(400).json({
        success: false,
        message: 'Missing secure hash'
      });
    }

    const isValidHash = verifyVNPAYHash(queryParams, receivedHash, VNPAY_CONFIG.HASH_SECRET);
    
    if (!isValidHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const responseCode = queryParams.vnp_ResponseCode;
    const orderId = queryParams.vnp_TxnRef;
    const amount = parseInt(queryParams.vnp_Amount) / 100;

    console.log(`Payment return: ${orderId}, Code: ${responseCode}, Amount: ${amount} VND`);

    if (responseCode === '00') {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Payment Success</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: green;">✅ Payment Successful!</h1>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Amount:</strong> ${amount.toLocaleString()} VND</p>
            <p><strong>Transaction Code:</strong> ${responseCode}</p>
            <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Back to Demo</a>
        </body>
        </html>
      `);
    } else {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Payment Failed</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: red;">❌ Payment Failed</h1>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Error Code:</strong> ${responseCode}</p>
            <a href="/" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Back to Demo</a>
        </body>
        </html>
      `);
    }

  } catch (error) {
    console.error('Error processing return:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment return'
    });
  }
});

// IPN handler
app.get('/api/webhooks/vnpay-ipn', (req, res) => {
  try {
    const queryParams = req.query;
    const receivedHash = queryParams.vnp_SecureHash;

    if (!receivedHash) {
      return res.status(400).send('Invalid IPN');
    }

    const isValidHash = verifyVNPAYHash(queryParams, receivedHash, VNPAY_CONFIG.HASH_SECRET);
    
    if (!isValidHash) {
      return res.status(400).send('Invalid signature');
    }

    const responseCode = queryParams.vnp_ResponseCode;
    const orderId = queryParams.vnp_TxnRef;
    const amount = parseInt(queryParams.vnp_Amount) / 100;

    console.log(`IPN received: ${orderId}, Code: ${responseCode}, Amount: ${amount} VND`);

    // Return success response to stop IPN retries
    res.send('{"RspCode":"00","Message":"OK"}');

  } catch (error) {
    console.error('Error processing IPN:', error);
    res.status(500).send('{"RspCode":"99","Message":"Internal Error"}');
  }
});

// Payment status endpoint
app.get('/api/payments/vnpay-status/:orderId', (req, res) => {
  const { orderId } = req.params;
  
  res.json({
    success: true,
    orderId: orderId,
    status: 'pending',
    message: 'Order status retrieved successfully'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 VNPAY Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 Demo homepage: http://localhost:${PORT}`);
  console.log(`💳 Test card: 4524 0418 7644 5035 (VÕ LONG SANG, 10/27, OTP: 160922)`);
  console.log(`🔧 Configuration:`);
  console.log(`   TMN Code: ${VNPAY_CONFIG.TMN_CODE}`);
  console.log(`   Payment URL: ${VNPAY_CONFIG.PAYMENT_URL}`);
  console.log(`   Return URL: ${VNPAY_CONFIG.RETURN_URL}`);
});

module.exports = app; 