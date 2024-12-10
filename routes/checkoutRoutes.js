import express from 'express';
import { createCheckout, getCheckoutById } from '../controllers/checkoutController.js';

const router = express.Router();

// Create a new checkout
router.post('/create', createCheckout);

// Get a checkout by ID with cart items
router.get('/:id', getCheckoutById);

export default router;

