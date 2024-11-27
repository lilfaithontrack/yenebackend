import express from 'express';
import { registerUser, loginUser, getUserById, updateUser, deleteUser } from '../controllers/userController.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes (requires token)
router.get('/', getUserById);  // Get logged-in user's info
router.put('/user/:id', updateUser);  // Update user details
router.delete('/user/:id', deleteUser);  // Delete user by ID

export default router;
