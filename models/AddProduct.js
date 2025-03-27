import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const AddProduct = sequelize.define('AddProduct', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { is: /^[a-zA-Z0-9-_]+$/i },
    unique: true,
  },
  color: DataTypes.STRING,
  size: DataTypes.STRING,
  brand: DataTypes.STRING,
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { isFloat: true, min: 0 },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { notEmpty: true },
  },
  catItems: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { notEmpty: true },
  },
  seller_email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: { isEmail: true },
  },
  image: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
  unit_of_measurement: DataTypes.STRING,
  stock: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'limited_stock'),
    allowNull: false,
    defaultValue: 'in_stock',
  },
  productfor: {
    type: DataTypes.ENUM('for_seller', 'for_user'),
    allowNull: false,
    defaultValue: 'for_user',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  location_prices: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: { 'Addis Ababa': 0 }, // Default price for Addis Ababa
    get() {
      const value = this.getDataValue('location_prices');
      return value ? JSON.parse(value) : { 'Addis Ababa': 0 }; // Ensure default if null
    },
    set(value) {
      const existingValue = this.getDataValue('location_prices') || {};
      this.setDataValue('location_prices', JSON.stringify({ ...existingValue, ...value }));
    },
  },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ unique: true, fields: ['sku'] }],
});

export default AddProduct;
