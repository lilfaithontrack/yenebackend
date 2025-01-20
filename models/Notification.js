import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const Notification = sequelize.define(
  'Notification',
  {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('unread', 'read'),
      allowNull: false,
      defaultValue: 'unread', // Default to unread
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users', // Links to the Users table
        key: 'id',
      },
      allowNull: true, // Nullable in case of guest notifications
    },
    guest_id: {
      type: DataTypes.STRING, // Optional field for guest notifications
      allowNull: true,
    },
    order_id: {
      type: DataTypes.INTEGER, // Link to an order if relevant
      allowNull: true,
    },
  },
  {
    tableName: 'Notifications',
    timestamps: true,
  }
);

export default Notification;
