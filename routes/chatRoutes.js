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
router.post("/",  sendMessage);

// Get chat history between two users
router.get("/:senderId/:receiverId", getChatHistory);

// Mark messages as read
router.patch("/read",  markAsRead);

// Get unread message count for a user
router.get("/unread/:userId/:role", getUnreadMessageCount);

export default router;
