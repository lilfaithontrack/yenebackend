import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const AddProduct = sequelize.define('AddProduct', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  catItems: { // Changed from categoryId to catItems
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subcat: { // Changed from subcategoryId to subcat
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  seller_email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'products', // Table name remains 'products'
  timestamps: true, // Enable timestamps for createdAt and updatedAt fields
});

export default AddProduct;
