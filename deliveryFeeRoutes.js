import express from 'express';
import { router as deliveryFeeRouter } from '../controllers/deliveryFeeModelAndController.js';

const router = express.Router();

router.use('/delivery-fee', deliveryFeeRouter);

export default router;
