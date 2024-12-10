// routes/paymentRoutes.js
import express from 'express';
import { createPayment, updatePaymentStatus,getOrderHistory,getAllOrders } from '../controllers/paymentController.js';

const router = express.Router();

// Route to create a payment
router.post('/create', createPayment);

// Route to update payment status
router.put('/update-status/:payment_id', updatePaymentStatus);
router.get('/orders/history', getOrderHistory);
router.get('/orders', getAllOrders);
export default router;

