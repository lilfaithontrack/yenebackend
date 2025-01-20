
import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const Chat = sequelize.define(
  'Chat',
  {
    sender_id: {
      type: DataTypes.STRING, // ID of the sender (admin, shopper, or delivery personnel)
      allowNull: false,
    },
    receiver_id: {
      type: DataTypes.STRING, // ID of the receiver
      allowNull: false,
    },
    sender_role: {
      type: DataTypes.ENUM('admin', 'shopper', 'delivery'), // Role of the sender
      allowNull: false,
    },
    receiver_role: {
      type: DataTypes.ENUM('admin', 'shopper', 'delivery'), // Role of the receiver
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT, // The message content
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN, // Indicates if the message has been read
      defaultValue: false,
    },
  },
  {
    tableName: 'Chats', // Name of the table
    timestamps: true, // Automatically add createdAt and updatedAt
  }
);

export default Chat;
