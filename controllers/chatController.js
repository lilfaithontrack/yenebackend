import Shopper from '../models/Shopper.js';
import Delivery from '../models/Delivery.js';
import Chat from "../models/Chat.js";
import Admin from '../models/Admin.js';
import sequelize from "../db/dbConnect.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, sender_role, receiver_role, message } = req.body;
    
    console.log("Received data:", req.body); // Add this log

    // Validate required fields
    if (!sender_id || !receiver_id || !sender_role || !receiver_role || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Create a new chat message
    const chat = await Chat.create({
      sender_id,
      receiver_id,
      sender_role,
      receiver_role,
      message,
    });

    console.log("Created chat:", chat); // Add this log to check if it's created

    res.status(201).json({ message: "Message sent successfully.", chat });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Get chat history between two users
export const getChatHistory = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Sender ID and Receiver ID are required." });
    }

    // Retrieve chat history between two users
    const chatHistory = await Chat.findAll({
      where: {
        [sequelize.Op.or]: [
          { sender_id: senderId, receiver_id: receiverId },
          { sender_id: receiverId, receiver_id: senderId },
        ],
      },
      order: [["createdAt", "ASC"]],
    });

    if (!chatHistory.length) {
      return res.status(404).json({ message: "No chat history found." });
    }

    res.status(200).json({ message: "Chat history retrieved successfully.", chatHistory });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body;

    if (!sender_id || !receiver_id) {
      return res.status(400).json({ message: "Sender ID and Receiver ID are required." });
    }

    // Update all unread messages to 'read'
    await Chat.update(
      { is_read: true },
      {
        where: {
          sender_id,
          receiver_id,
          is_read: false,
        },
      }
    );

    res.status(200).json({ message: "Messages marked as read." });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch unread message count for a user
export const getUnreadMessageCount = async (req, res) => {
  try {
    const { userId, role } = req.params;

    if (!userId || !role) {
      return res.status(400).json({ message: "User ID and role are required." });
    }

    const unreadCount = await Chat.count({
      where: {
        receiver_id: userId,
        receiver_role: role,
        is_read: false,
      },
    });

    res.status(200).json({ message: "Unread message count fetched successfully.", unreadCount });
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
