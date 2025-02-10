import express from 'express';
import { registerSeller, loginSeller, updateSeller, getSellerById, deleteSeller } from '../controllers/sellerController.js';
import { upload } from '../controllers/sellerController.js'; // Import multer upload instance

const router = express.Router();

// Seller registration (with file upload support)
router.post('/register', upload.single('image'), registerSeller); // Supports image file upload

// Seller login
router.post('/login', loginSeller);

// Update seller details (with file upload support)
router.put('/update/:id', upload.single('image'), updateSeller); // Supports image or license file update

// Get seller by ID
router.get('/:id', getSellerById);

// Delete a seller
router.delete('/:id', deleteSeller);

export default router;
