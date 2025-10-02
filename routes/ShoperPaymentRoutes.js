// routes/paymentRoutes.js
import express from "express";
import { verifyShopper } from "../middlewares/verifyShopper.js";
import {
  addPaymentAccount,
  getMyPaymentAccounts,
  updatePaymentAccount,
  deletePaymentAccount,
} from "../controllers/ShoperPaymentController.js";

const router = express.Router();

// Add a new payment account
router.post("/", verifyShopper, addPaymentAccount);

// Get all payment accounts for logged-in shopper
router.get("/", verifyShopper, getMyPaymentAccounts);

// Update a payment account
router.put("/:id", verifyShopper, updatePaymentAccount);

// Delete a payment account
router.delete("/:id", verifyShopper, deletePaymentAccount);

export default router;

