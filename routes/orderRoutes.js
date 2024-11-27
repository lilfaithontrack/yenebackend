import express from 'express';
import { createOrder, processPayment, getOrder, getAllOrders, deleteOrder } from '../controllers/orderController.js';

const router = express.Router();

router.post('/create', createOrder); // Create order
router.post('/payment', processPayment); // Process payment
router.get('/order/:orderId', getOrder); // Get single order
router.get('/orders/user/:userId', getAllOrders); // Get all orders by user
router.delete('/order/:orderId', deleteOrder); // Delete order

export default router;
