import express from 'express';
import { processChapaPayment, uploadPaymentScreenshot } from '../controllers/paymentController.js';

 // Assuming the file upload middleware

const router = express.Router();

// Process Chapa payment
router.post('/chapa', processChapaPayment);

// Upload payment screenshot
router.post('/payment/screenshot', uploadPaymentScreenshot);

export default router;
