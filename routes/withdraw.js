import express from 'express';
import { requestWithdraw } from '../controllers/withdrawController.js';

const router = express.Router();

router.post('/request', requestWithdraw);

export default router;
