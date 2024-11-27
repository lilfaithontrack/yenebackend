import { Sequelize, DataTypes } from 'sequelize';
import sequelize from '../db/dbconnect.js';
import Cart from './Cart.js'; // Assuming you have the Cart model defined

const Checkout = sequelize.define('Checkout', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customer_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Prevent empty name
    }
  },
  customer_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true, // Ensures email is in a valid format
      notEmpty: true, // Prevent empty email
    }
  },
  customer_phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Prevent empty phone
    }
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true, // Prevent empty address
    }
  },
  total_price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      isFloat: true, // Ensures that the price is a float number
      notEmpty: true, // Prevent empty price
    }
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  order_status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'canceled'),
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
  },
}, {
  timestamps: false,
  tableName: 'checkouts',
});

// Association with Cart (One-to-Many)
Checkout.hasMany(Cart, { foreignKey: 'checkout_id' });
Cart.belongsTo(Checkout, { foreignKey: 'checkout_id' });

export default Checkout;
