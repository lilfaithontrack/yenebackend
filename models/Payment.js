import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db/dbconnect.js'; // Make sure you have a correct database connection

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'orders', // Ensure that the orders model exists and is connected
      key: 'id',
    },
  },
  paymentMethod: {
    type: DataTypes.ENUM('chapa', 'screenshot'),
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true, // This will be for Chapa payment transactions
  },
  screenshotUrl: {
    type: DataTypes.STRING,
    allowNull: true, // This will store the URL of the uploaded screenshot
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
  },
}, {
  timestamps: false,
  tableName: 'payments',
});

export default Payment;
