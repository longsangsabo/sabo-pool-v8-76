# VNPAY Payment Gateway Integration

This document provides a complete guide for integrating VNPAY payment gateway into the Sabo Pool Arena application.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install express crypto moment dotenv querystring axios cors helmet morgan

# Or use the provided backend-package.json
npm install
```

### 2. Environment Configuration

Create a `.env` file in your project root with the following VNPAY test configuration:

```env
# VNPAY Payment Gateway Configuration
VNP_TMN_CODE=T53WMA78
VNP_HASH_SECRET=2TNWAPY5F1REXUB1XTMDUYBKFGI2DZP6
VNP_RETURN_URL=https://your-domain.com/api/webhooks/vnpay-return
VNP_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_IPN_URL=https://your-domain.com/api/webhooks/vnpay-ipn

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## 📋 API Endpoints

### Create Payment
**POST** `/api/payments/create-vnpay`

Creates a new VNPAY payment request.

**Request Body:**
```json
{
  "orderId": "ORDER_123456",
  "amount": 100000,
  "orderInfo": "Payment for order #123456",
  "orderType": "billpayment"
}
```

**Response:**
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "orderId": "ORDER_123456",
  "amount": 100000,
  "message": "Payment URL generated successfully"
}
```

### Payment Return Handler
**GET** `/api/webhooks/vnpay-return`

Handles user redirect after payment completion.

**Query Parameters:**
- `vnp_ResponseCode`: Payment response code
- `vnp_TxnRef`: Order reference
- `vnp_Amount`: Payment amount
- `vnp_SecureHash`: Security hash

**Response:**
```json
{
  "success": true,
  "code": "00",
  "orderId": "ORDER_123456",
  "amount": 100000,
  "transactionId": "12345678",
  "message": "Payment completed successfully"
}
```

### Instant Payment Notification (IPN)
**GET** `/api/webhooks/vnpay-ipn`

Handles server-to-server payment notifications.

**Response:**
```json
{"RspCode":"00","Message":"OK"}
```

### Payment Status
**GET** `/api/payments/vnpay-status/:orderId`

Get payment status for an order.

**Response:**
```json
{
  "success": true,
  "orderId": "ORDER_123456",
  "status": "paid",
  "message": "Order status retrieved successfully"
}
```

### Refund Payment
**POST** `/api/payments/vnpay-refund`

Process refund for a VNPAY payment.

**Request Body:**
```json
{
  "orderId": "ORDER_123456",
  "amount": 100000,
  "reason": "Customer requested refund"
}
```

## 🧪 Test Configuration

### Test Environment
- **Payment URL**: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`
- **TMN Code**: `T53WMA78`
- **Hash Secret**: `2TNWAPY5F1REXUB1XTMDUYBKFGI2DZP6`

### Test Card Details (VCB Bank)
- **Card Number**: `4524 0418 7644 5035`
- **Cardholder Name**: `VÕ LONG SANG`
- **Expiry Date**: `10/27`
- **OTP**: `160922`

## 🔧 Integration Steps

### 1. Frontend Integration

```javascript
// Create payment request
const createPayment = async (orderData) => {
  try {
    const response = await fetch('/api/payments/create-vnpay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderData.id,
        amount: orderData.amount,
        orderInfo: orderData.description,
        orderType: 'billpayment'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Redirect to VNPAY payment page
      window.location.href = result.paymentUrl;
    } else {
      console.error('Payment creation failed:', result.message);
    }
  } catch (error) {
    console.error('Error creating payment:', error);
  }
};

// Check payment status
const checkPaymentStatus = async (orderId) => {
  try {
    const response = await fetch(`/api/payments/vnpay-status/${orderId}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error checking payment status:', error);
  }
};
```

### 2. Database Integration

Update the TODO sections in the code with your database operations:

```javascript
// Example database operations
const updateOrderStatus = async (orderId, status, paymentData) => {
  // Update order in your database
  await db.orders.update({
    where: { id: orderId },
    data: {
      status: status,
      paymentData: paymentData,
      updatedAt: new Date()
    }
  });
};

const getOrder = async (orderId) => {
  // Get order from your database
  return await db.orders.findUnique({
    where: { id: orderId }
  });
};
```

### 3. Error Handling

The integration includes comprehensive error handling for:

- Missing required parameters
- Invalid amounts
- Hash verification failures
- Database operation errors
- Network timeouts

## 🔒 Security Features

### Hash Verification
All incoming requests are verified using HMAC SHA512 hash to ensure data integrity.

### IP Address Validation
Client IP addresses are captured and validated for security.

### Environment Variable Protection
Sensitive configuration is stored in environment variables.

### Rate Limiting
Implement rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many payment requests from this IP'
});

app.use('/api/payments', paymentLimiter);
```

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 00   | Success |
| 07   | Invalid amount |
| 09   | Invalid order information |
| 13   | Invalid order type |
| 24   | Customer cancelled |
| 51   | Insufficient balance |
| 65   | Exceeded daily limit |
| 75   | Bank maintenance |
| 79   | Invalid payment information |
| 99   | Unknown error |

## 🚀 Production Deployment

### 1. Environment Variables
Update environment variables for production:

```env
VNP_TMN_CODE=your_production_tmn_code
VNP_HASH_SECRET=your_production_hash_secret
VNP_RETURN_URL=https://your-production-domain.com/api/webhooks/vnpay-return
VNP_PAYMENT_URL=https://pay.vnpay.vn/vpcpay.html
VNP_IPN_URL=https://your-production-domain.com/api/webhooks/vnpay-ipn
```

### 2. SSL Certificate
Ensure your domain has a valid SSL certificate for secure communication.

### 3. Webhook URLs
Configure webhook URLs in your VNPAY merchant dashboard.

### 4. Monitoring
Implement logging and monitoring for payment transactions:

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'payment-logs.json' }),
    new winston.transports.Console()
  ]
});
```

## 🧪 Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Create a payment: `POST /api/payments/create-vnpay`
3. Use test card details to complete payment
4. Verify return URL handling
5. Check IPN notifications

### Automated Testing
```bash
# Run tests
npm test

# Test specific endpoints
npm test -- --grep "VNPAY"
```

## 📝 Logging

The integration includes comprehensive logging for:

- Payment creation
- Hash verification
- Payment returns
- IPN processing
- Error handling

Logs are written to console and can be configured for file output.

## 🔧 Troubleshooting

### Common Issues

1. **Hash Verification Failed**
   - Check environment variables
   - Verify parameter sorting
   - Ensure correct hash secret

2. **Payment URL Not Working**
   - Validate TMN code
   - Check payment URL configuration
   - Verify parameter encoding

3. **IPN Not Received**
   - Check webhook URL configuration
   - Verify server accessibility
   - Check firewall settings

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📞 Support

For VNPAY-specific issues, contact VNPAY support:
- Email: support@vnpay.vn
- Phone: +84 24 3944 6699
- Documentation: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop

## 📄 License

This integration is provided under the MIT License. See LICENSE file for details. 