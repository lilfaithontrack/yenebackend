import express from 'express';
import { upload, createCatItem, getAllCatItems } from '../controllers/CatItemController.js';

const router = express.Router();

// Create a new CatItem
router.post('/create', upload.single('image'), createCatItem);

// Get all CatItems
router.get('/', getAllCatItems);

export default router;
