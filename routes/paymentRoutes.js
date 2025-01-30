import express from 'express';
import { 
  createPayment, 
  updatePaymentStatus, 
  sendOrderToShopperAndDelivery, 
  getOrderHistory, 
  getAllOrders ,
  getPaymentOrderById 
} from '../controllers/paymentController.js';

const router = express.Router();

// Base route for payments
router.post('/create', createPayment);

// Route to update payment status
router.put('/update-status/:payment_id', updatePaymentStatus);

// Route to fetch order history by customer_email or guest_id
router.get('/orders/history', getOrderHistory);

// Route to fetch all orders
router.get('/orders', getAllOrders);
//route to fetch the payment order based on the id 
router.get('/orders/:payment_id', getPaymentOrderById);

// Route to send order to shopper and delivery (approve and assign)
router.put('/:payment_id/send-order', sendOrderToShopperAndDelivery);

export default router;
