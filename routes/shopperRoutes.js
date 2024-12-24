import express from 'express';
import {
  createShopper,
  getAllShoppers,
  getShopperById,
  updateShopper,
  deleteShopper,
  loginShopper,
  findNearbyShoppers, // Import the new function
} from '../controllers/shopperController.js';

const router = express.Router();

router.post('/', createShopper);
router.get('/', getAllShoppers);
router.get('/:id', getShopperById);
router.put('/:id', updateShopper);
router.delete('/:id', deleteShopper);
router.post('/login', loginShopper);
router.get('/nearby', findNearbyShoppers); // New route for finding nearby shoppers

export default router;
