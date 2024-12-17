import express from 'express';
import {
  createShopper,
  getAllShoppers,
  getShopperById,
  updateShopper,
  deleteShopper,
} from '../controllers/shopperController.js';

const router = express.Router();

// Routes
router.post('/', createShopper);        // Create a new shopper
router.get('/', getAllShoppers);        // Get all shoppers
router.get('/:id', getShopperById);    // Get a specific shopper by ID
router.put('/:id', updateShopper);     // Update a specific shopper
router.delete('/:id', deleteShopper);  // Delete a shopper by ID

export default router;
