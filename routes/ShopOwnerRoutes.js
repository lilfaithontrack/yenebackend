import express from 'express';
import adminAuth from '../middleware/adminAuth.js'; // Ensure the path is correct
import {
  addShopOwner,
  getAllShopOwners,
  getShopOwnerById,
  updateShopOwner,
  deleteShopOwner,
  uploadIdFile,
} from '../controllers/shopOwnerController.js';

const router = express.Router();

// Protected routes using adminAuth middleware

// Add a new shop owner (Admin Only)
router.post('/add', uploadIdFile, addShopOwner);

// Get all shop owners (Admin Only)
router.get('/', adminAuth, getAllShopOwners);

// Get a shop owner by ID (Admin Only)
router.get('/:id', adminAuth, getShopOwnerById);

// Update a shop owner (Admin Only)
router.put('/update/:id', adminAuth, uploadIdFile, updateShopOwner);

// Delete a shop owner (Admin Only)
router.delete('/delete/:id', adminAuth, deleteShopOwner);

export default router;
