import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import axios from 'axios';
import { processPaymentGateway} from '../services/paymentService.js'; // Optional if custom service exists
import { uploadScreenshot } from '../utlis/fileUpload.js'; // Ensure this is implemented

// Handle Chapa payment processing
export const processChapaPayment = async (req, res) => {
  const { userId, customerName, customerEmail, customerPhone, shippingAddress, totalPrice, servicePayment } = req.body;

  try {
    // Step 1: Generate transaction reference and define callback URL
    const txRef = `tx-${Date.now()}`; // Unique transaction reference
    const callbackUrl = 'http://localhost:3000/success'; // Adjust for production environment

    // Step 2: Initialize Chapa payment
    const chapaResponse = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      {
        amount: totalPrice,
        currency: 'ETB',
        email: customerEmail,
        first_name: customerName,
        tx_ref: txRef,
        callback_url: callbackUrl,
        customization: {
          title: 'Yene Suq Checkout',
          description: 'Payment for your order',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`, // Ensure this is set in your .env file
        },
      }
    );

    // Step 3: Check response and return the payment URL
    if (chapaResponse.data.status === 'success') {
      return res.status(200).json({
        success: true,
        paymentUrl: chapaResponse.data.data.checkout_url,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Failed to initialize payment with Chapa.',
    });
  } catch (error) {
    console.error('Error during Chapa payment:', error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error processing Chapa payment. Please try again later.',
    });
  }
};

// Handle screenshot upload for payment
export const uploadPaymentScreenshot = async (req, res) => {
  const { orderId } = req.body;
  const screenshotFile = req.file; // Assume file upload middleware (e.g., multer)

  try {
    // Step 1: Validate order existence
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Step 2: Validate screenshot file
    if (!screenshotFile) {
      return res.status(400).json({
        success: false,
        message: 'Screenshot is required.',
      });
    }

    // Step 3: Upload screenshot and save payment details
    const screenshotUrl = await uploadScreenshot(screenshotFile); // Implement this in `fileUpload.js`

    const payment = await Payment.create({
      orderId,
      paymentMethod: 'screenshot',
      paymentStatus: 'pending',
      screenshotUrl,
    });

    // Step 4: Respond with success message
    return res.status(200).json({
      success: true,
      message: 'Screenshot uploaded successfully.',
      payment,
    });
  } catch (error) {
    console.error('Error uploading screenshot for payment:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error uploading screenshot for payment.',
      error: error.message,
    });
  }
};
