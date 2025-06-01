import express from 'express';
import {
  createUOM,
  getUOMsByProduct,
  updateUOM,
  deleteUOM
} from '../controllers/uomController.js';

const router = express.Router();

// POST /api/uoms
router.post('/', createUOM);

// GET /api/uoms/:productId
router.get('/:productId', getUOMsByProduct);

// PUT /api/uoms/:id
router.put('/:id', updateUOM);

// DELETE /api/uoms/:id
router.delete('/:id', deleteUOM);

export default router;
