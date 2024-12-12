import express from 'express';
import { getAllProducts, addProduct, updateProduct, deleteProduct, upload } from '../controllers/addProductController.js';

const router = express.Router();

router.get('/add', getAllProducts);
router.post('/add', upload.single('image'), addProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);

export default router;
