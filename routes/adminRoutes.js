import express from 'express';
import {
  registerAdmin,
  loginAdmin,
  createAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} from '../controllers/adminController.js'; 
import {
  registerDelivery,
  deleteDelivery,
} from '../controllers/deliveryController.js';
import adminAuth from '../middlewares/adminMiddleware.js'; // Admin middleware

const router = express.Router();

// Admin registration (Public)
router.post('/register', registerAdmin);

// Admin login (Public)
router.post('/login', loginAdmin);

// Create a new admin (Protected, only accessible by authenticated admins)
router.post('/', adminAuth, createAdmin);

// Get all admins (Protected, only accessible by authenticated admins)
router.get('/', adminAuth, getAllAdmins);

// Get an admin by ID (Protected, only accessible by authenticated admins)
router.get('/:id', adminAuth, getAdminById);

// Update an admin's details (Protected, only accessible by authenticated admins)
router.put('/:id', adminAuth, updateAdmin);

// Delete an admin (Protected, only accessible by authenticated admins)
router.delete('/:id', adminAuth, deleteAdmin);
router.post('/register-delivery', registerDelivery); // Admin registers a delivery account
router.delete('/delete-delivery/:id', deleteDelivery); // Admin deletes a delivery account
export default router;
