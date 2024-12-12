import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';  // Your Sequelize connection

const AddProduct = sequelize.define('AddProduct', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sku: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  color: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  size: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  brand: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  price: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  cat_items: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subcats: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  ordered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  Active_Quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  verification: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  status: {
    type: DataTypes.TEXT,
    defaultValue: 'Available',
  },
  seller_email: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'products', // Explicitly map this model to the "products" table
  timestamps: true, // Adds createdAt and updatedAt fields automatically
});

export default AddProduct;
