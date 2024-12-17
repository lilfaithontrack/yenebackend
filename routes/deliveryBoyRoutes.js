import express from 'express';
import {
  createDeliveryBoy,
  getAllDeliveryBoys,
  getDeliveryBoyById,
  updateDeliveryBoy,
  deleteDeliveryBoy,
} from '../controllers/deliveryBoyController.js';

const router = express.Router();

// Routes
router.post('/delivery-boys', createDeliveryBoy);        // Create a new delivery boy
router.get('/delivery-boys', getAllDeliveryBoys);        // Get all delivery boys
router.get('/delivery-boys/:id', getDeliveryBoyById);    // Get a specific delivery boy by ID
router.put('/delivery-boys/:id', updateDeliveryBoy);     // Update a specific delivery boy
router.delete('/delivery-boys/:id', deleteDeliveryBoy);  // Delete a delivery boy by ID

export default router;
