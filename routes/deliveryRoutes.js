import express from 'express';
import {
  loginDelivery,
} from '../controllers/deliveryController.js'; // Import your authentication middleware

const router = express.Router();

// Routes for delivery user management
 // Register a new delivery user
router.post('/login', loginDelivery); 

export default router;
