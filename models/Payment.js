import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';
// Import AssignOrder first

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
    service_fee: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    delivery_fee: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
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
    referral_code: {
    type: DataTypes.STRING,
    allowNull: true,
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

export default Payment;
