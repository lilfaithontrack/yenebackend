// routes/telalakiRoutes.js
import express from 'express';
import { createTelalaki, findMatchingTelalaki } from '../controllers/telalakiController.js';

const router = express.Router();

router.post('/telalaki', createTelalaki);
router.get('/telalaki/match', findMatchingTelalaki);

export default router;
