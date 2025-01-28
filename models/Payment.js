import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';
import AssignOrder from './AssignOrder.js';

const Payment = sequelize.define(
  'Payment',
  {
    payment_method: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'banktransfer', // Default payment method set to 'banktransfer'
    },
    payment_screenshot: {
      type: DataTypes.STRING, // URL or path to the uploaded screenshot
      allowNull: false,
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Pending', // Default payment status
    },
    cart_items: {
      type: DataTypes.JSONB, // Store cart items as JSON
      allowNull: false,
    },
    total_price: {
      type: DataTypes.FLOAT, // Store the total price
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.STRING, // Store shipping address
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING, // Store the customer's name
      allowNull: false,
    },
    customer_email: {
      type: DataTypes.STRING, // Store the customer's email
      allowNull: false,
    },
    customer_phone: {
      type: DataTypes.STRING, // Store the customer's phone number
      allowNull: false,
    },
    guest_id: {
      type: DataTypes.STRING, // Optionally store guest ID (can be null for registered users)
      allowNull: true, // Nullable if no guest ID is provided
    },
  },
  {
    tableName: 'Payments', // Ensures the table name is 'Payments'
    timestamps: true, // Automatically handles createdAt and updatedAt fields
  }
);

// Define associations in a separate function to avoid circular dependencies
Payment.associate = (models) => {
  Payment.hasOne(models.AssignOrder, { foreignKey: 'payment_id' });
};

export default Payment;
