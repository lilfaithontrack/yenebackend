import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';
import AssignOrder from './AssignOrder.js'; // Import AssignOrder first

const Payment = sequelize.define(
  'Payment',
  {
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'banktransfer',
    },
    payment_screenshot: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending',
    },
    cart_items: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    total_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customer_phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guest_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'Payments',
    timestamps: true,
  }
);

// Make sure the AssignOrder model is imported first before calling associations
Payment.hasOne(AssignOrder, { foreignKey: 'payment_id' }); // Correct method name

export default Payment;
