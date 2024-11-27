import express from 'express';
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import adminAuth from '../middlewares/adminMiddleware.js'; // Ensure the path is correct
import { upload } from '../utlis/multerConfig.js'; // Import the multer config

const router = express.Router();

/**
 * @route   POST /api/categories
 * @desc    Create a new category with subcategories and an optional image
 * @access  Admin only
 */
router.post('/create', adminAuth, upload.single('image'), createCategory);

/**
 * @route   GET /api/categories
 * @desc    Fetch all categories with their subcategories
 * @access  Public
 */
router.get('/', getAllCategories);

/**
 * @route   GET /api/categories/:id
 * @desc    Fetch category by ID with its subcategories
 * @access  Public
 */
router.get('/:id', getCategoryById);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update a category and its subcategories, including image
 * @access  Admin only
 */
router.put('/:id', adminAuth, upload.single('image'), updateCategory);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete a category and its subcategories
 * @access  Admin only
 */
router.delete('/:id', adminAuth, deleteCategory);

export default router;
