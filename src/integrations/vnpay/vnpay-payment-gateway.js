const express = require('express');
const crypto = require('crypto');
const moment = require('moment');
const querystring = require('querystring');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

/**
 * VNPAY Payment Gateway Integration
 * 
 * This module provides a complete integration with VNPAY payment gateway
 * including payment creation, return URL handling, and IPN (Instant Payment Notification).
 * 
 * Updated Configuration:
 * - TMN Code: T53WMA78
 * - Hash Secret: M1TOK8Z2U7KIPX67FDFBSXTPHGSEFHZ9
 * - Payment URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
 * 
 * Test Card Details (VCB Bank):
 * - Card Number: 4524 0418 7644 5035
 * - Name: VÕ LONG SANG
 * - Expiry: 10/27
 * - OTP: 160922
 */

/**
 * Utility function to create VNPAY secure hash
 * @param {Object} params - Parameters to hash
 * @param {string} secretKey - VNPAY hash secret
 * @returns {string} HMAC SHA512 hash
 */
function createVNPAYHash(params, secretKey) {
  try {
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
  } catch (error) {
    console.error('Error creating VNPAY hash:', error);
    throw new Error('Failed to create payment hash');
  }
}

/**
 * Utility function to verify VNPAY secure hash
 * @param {Object} params - Parameters to verify
 * @param {string} receivedHash - Hash received from VNPAY
 * @param {string} secretKey - VNPAY hash secret
 * @returns {boolean} True if hash is valid
 */
function verifyVNPAYHash(params, receivedHash, secretKey) {
  try {
    // Remove vnp_SecureHash from params for verification
    const paramsForVerification = { ...params };
    delete paramsForVerification.vnp_SecureHash;

    // Create hash from received parameters
    const calculatedHash = createVNPAYHash(paramsForVerification, secretKey);
    
    // Compare hashes (case-insensitive)
    return calculatedHash.toLowerCase() === receivedHash.toLowerCase();
  } catch (error) {
    console.error('Error verifying VNPAY hash:', error);
    return false;
  }
}

/**
 * Utility function to get client IP address
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.connection.socket?.remoteAddress || 
         '127.0.0.1';
}

/**
 * POST /api/payments/create-vnpay
 * Creates a new VNPAY payment request
 * 
 * Request Body:
 * {
 *   "orderId": "ORDER_123456",
 *   "amount": 100000, // Amount in VND
 *   "orderInfo": "Payment for order #123456",
 *   "orderType": "billpayment"
 * }
 */
router.post('/create-vnpay', async (req, res) => {
  try {
    const { orderId, amount, orderInfo, orderType } = req.body;

    // Validate required parameters
    if (!orderId || !amount || !orderInfo || !orderType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: orderId, amount, orderInfo, orderType'
      });
    }

    // Validate amount (must be positive)
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Validate environment variables
    if (!process.env.VNP_TMN_CODE || !process.env.VNP_HASH_SECRET || 
        !process.env.VNP_RETURN_URL || !process.env.VNP_PAYMENT_URL) {
      console.error('Missing VNPAY environment variables');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway configuration error'
      });
    }

    // Build VNPAY parameters
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: process.env.VNP_TMN_CODE,
      vnp_Amount: Math.round(amount * 100), // Convert to smallest currency unit
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_ReturnUrl: process.env.VNP_RETURN_URL,
      vnp_IpAddr: getClientIP(req),
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_Locale: 'vn' // Vietnamese locale
    };

    // Create secure hash
    const secureHash = createVNPAYHash(params, process.env.VNP_HASH_SECRET);
    params.vnp_SecureHash = secureHash;

    // Build payment URL
    const paymentUrl = `${process.env.VNP_PAYMENT_URL}?${querystring.stringify(params)}`;

    // Log payment creation
    console.log(`VNPAY Payment created for order: ${orderId}, amount: ${amount} VND`);

    // Return payment URL
    res.json({
      success: true,
      paymentUrl: paymentUrl,
      orderId: orderId,
      amount: amount,
      message: 'Payment URL generated successfully'
    });

  } catch (error) {
    console.error('Error creating VNPAY payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment request'
    });
  }
});

/**
 * GET /api/webhooks/vnpay-return
 * Handles VNPAY payment return (user redirect)
 * 
 * Query Parameters:
 * - vnp_ResponseCode: Payment response code
 * - vnp_TxnRef: Order reference
 * - vnp_Amount: Payment amount
 * - vnp_SecureHash: Security hash
 * - ... other VNPAY parameters
 */
router.get('/webhooks/vnpay-return', async (req, res) => {
  try {
    const queryParams = req.query;
    const receivedHash = queryParams.vnp_SecureHash;

    // Validate required parameters
    if (!receivedHash) {
      console.error('VNPAY Return: Missing secure hash');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment response'
      });
    }

    // Verify hash
    const isValidHash = verifyVNPAYHash(queryParams, receivedHash, process.env.VNP_HASH_SECRET);
    
    if (!isValidHash) {
      console.error('VNPAY Return: Invalid hash for order:', queryParams.vnp_TxnRef);
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const responseCode = queryParams.vnp_ResponseCode;
    const orderId = queryParams.vnp_TxnRef;
    const amount = parseInt(queryParams.vnp_Amount) / 100; // Convert back from smallest unit
    const transactionId = queryParams.vnp_TransactionNo;

    // Log payment return
    console.log(`VNPAY Return: Order ${orderId}, Response Code: ${responseCode}, Amount: ${amount} VND`);

    // Check payment status
    if (responseCode === '00') {
      // Payment successful
      try {
        // TODO: Update order status in database
        // await updateOrderStatus(orderId, 'paid', {
        //   transactionId: transactionId,
        //   amount: amount,
        //   paymentMethod: 'vnpay',
        //   paidAt: new Date()
        // });

        console.log(`Payment successful for order: ${orderId}`);

        // Redirect to success page or return success response
        res.json({
          success: true,
          code: responseCode,
          orderId: orderId,
          amount: amount,
          transactionId: transactionId,
          message: 'Payment completed successfully'
        });

      } catch (dbError) {
        console.error('Error updating order status:', dbError);
        res.json({
          success: false,
          code: responseCode,
          message: 'Payment received but order update failed'
        });
      }
    } else {
      // Payment failed
      const errorMessages = {
        '07': 'Transaction failed - Invalid amount',
        '09': 'Transaction failed - Invalid order information',
        '13': 'Transaction failed - Invalid order type',
        '24': 'Transaction failed - Customer cancelled',
        '51': 'Transaction failed - Insufficient balance',
        '65': 'Transaction failed - Exceeded daily limit',
        '75': 'Transaction failed - Bank maintenance',
        '79': 'Transaction failed - Invalid payment information',
        '99': 'Transaction failed - Unknown error'
      };

      const errorMessage = errorMessages[responseCode] || 'Payment failed';

      console.log(`Payment failed for order: ${orderId}, Code: ${responseCode}`);

      // TODO: Update order status in database
      // await updateOrderStatus(orderId, 'failed', {
      //   errorCode: responseCode,
      //   errorMessage: errorMessage,
      //   failedAt: new Date()
      // });

      res.json({
        success: false,
        code: responseCode,
        orderId: orderId,
        message: errorMessage
      });
    }

  } catch (error) {
    console.error('Error processing VNPAY return:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment return'
    });
  }
});

/**
 * GET /api/webhooks/vnpay-ipn
 * Handles VNPAY Instant Payment Notification (IPN)
 * 
 * Query Parameters:
 * - vnp_ResponseCode: Payment response code
 * - vnp_TxnRef: Order reference
 * - vnp_Amount: Payment amount
 * - vnp_SecureHash: Security hash
 * - ... other VNPAY parameters
 */
router.get('/webhooks/vnpay-ipn', async (req, res) => {
  try {
    const queryParams = req.query;
    const receivedHash = queryParams.vnp_SecureHash;

    // Validate required parameters
    if (!receivedHash) {
      console.error('VNPAY IPN: Missing secure hash');
      return res.status(400).send('Invalid IPN');
    }

    // Verify hash
    const isValidHash = verifyVNPAYHash(queryParams, receivedHash, process.env.VNP_HASH_SECRET);
    
    if (!isValidHash) {
      console.error('VNPAY IPN: Invalid hash for order:', queryParams.vnp_TxnRef);
      return res.status(400).send('Invalid signature');
    }

    const responseCode = queryParams.vnp_ResponseCode;
    const orderId = queryParams.vnp_TxnRef;
    const amount = parseInt(queryParams.vnp_Amount) / 100;
    const transactionId = queryParams.vnp_TransactionNo;

    // Log IPN
    console.log(`VNPAY IPN: Order ${orderId}, Response Code: ${responseCode}, Amount: ${amount} VND`);

    // Verify payment status
    if (responseCode === '00') {
      try {
        // TODO: Verify order exists and amount matches
        // const order = await getOrder(orderId);
        // if (!order || order.amount !== amount) {
        //   console.error(`VNPAY IPN: Order verification failed for ${orderId}`);
        //   return res.status(400).send('Order verification failed');
        // }

        // TODO: Update order status in database
        // await updateOrderStatus(orderId, 'paid', {
        //   transactionId: transactionId,
        //   amount: amount,
        //   paymentMethod: 'vnpay',
        //   paidAt: new Date(),
        //   ipnReceived: true
        // });

        console.log(`VNPAY IPN: Payment confirmed for order: ${orderId}`);

        // Return success response to stop IPN retries
        res.send('{"RspCode":"00","Message":"OK"}');

      } catch (dbError) {
        console.error('VNPAY IPN: Error updating order:', dbError);
        res.status(500).send('{"RspCode":"99","Message":"Internal Error"}');
      }
    } else {
      // Payment failed
      console.log(`VNPAY IPN: Payment failed for order: ${orderId}, Code: ${responseCode}`);

      // TODO: Update order status in database
      // await updateOrderStatus(orderId, 'failed', {
      //   errorCode: responseCode,
      //   failedAt: new Date(),
      //   ipnReceived: true
      // });

      // Return success response to stop IPN retries
      res.send('{"RspCode":"00","Message":"OK"}');
    }

  } catch (error) {
    console.error('Error processing VNPAY IPN:', error);
    res.status(500).send('{"RspCode":"99","Message":"Internal Error"}');
  }
});

/**
 * GET /api/payments/vnpay-status/:orderId
 * Get payment status for an order
 */
router.get('/vnpay-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    // TODO: Get order status from database
    // const order = await getOrder(orderId);
    // if (!order) {
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Order not found'
    //   });
    // }

    // Mock response for demonstration
    res.json({
      success: true,
      orderId: orderId,
      status: 'pending', // pending, paid, failed
      message: 'Order status retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

/**
 * POST /api/payments/vnpay-refund
 * Process refund for a VNPAY payment
 */
router.post('/vnpay-refund', async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;

    // Validate parameters
    if (!orderId || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: orderId, amount, reason'
      });
    }

    // TODO: Implement refund logic
    // This would typically involve calling VNPAY's refund API
    console.log(`Refund requested for order: ${orderId}, amount: ${amount} VND, reason: ${reason}`);

    res.json({
      success: true,
      orderId: orderId,
      amount: amount,
      message: 'Refund request submitted successfully'
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

module.exports = router; 