import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const SellerProduct = sequelize.define('SellerProduct', {
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
  catItems: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  seller_email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  image: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  unit_of_measurement: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  stock: {
    type: DataTypes.ENUM('out_of_stock','in_stock','limited_stock')
    allowNull: true,
  },
  bank: {
    type: DataTypes.STRING,
    allowNull: true, // Optional
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true, // Optional
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved'),
    allowNull: false,
    defaultValue: 'pending', // Always starts as 'pending'
  },
}, {
  tableName: 'seller_products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default SellerProduct;
