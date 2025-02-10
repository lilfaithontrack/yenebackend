import express from 'express';
import { registerSeller, loginSeller, updateSeller, getSellerById, deleteSeller, forgotPassword, resetPassword } from '../controllers/sellerController.js';
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
// reset password and  forgot pass word
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);
export default router;
