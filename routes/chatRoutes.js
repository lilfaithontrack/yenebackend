import express from "express";
import {
  sendMessage,
  getChatHistory,
  markAsRead,
  getUnreadMessageCount,
} from "../controllers/chatController.js";
import authenticateUser from "../middlewares/authenticateUser.js";

const router = express.Router();

// Send a message
router.post("/", authenticateUser(["admin", "delivery", "shopper"]), sendMessage);

// Get chat history between two users
router.get("/:senderId/:receiverId", authenticateUser(["admin", "delivery", "shopper"]), getChatHistory);

// Mark messages as read
router.patch("/read", authenticateUser(["admin", "delivery", "shopper"]), markAsRead);

// Get unread message count for a user
router.get("/unread/:userId/:role", authenticateUser(["admin", "delivery", "shopper"]), getUnreadMessageCount);

export default router;
