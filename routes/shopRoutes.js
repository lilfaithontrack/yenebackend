import express from 'express';
import {
  registerShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
  findNearbyShops,
} from '../controllers/shopController.js';

const router = express.Router();

router.post('/register', registerShop);
router.get('/', getAllShops);
router.get('/:id', getShopById);
router.put('/:id', updateShop);
router.delete('/:id', deleteShop);
router.get('/nearby', findNearbyShops);

export default router;
