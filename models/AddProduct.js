import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const AddProduct = sequelize.define('AddProduct', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,  // Ensure title is not empty
    },
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isAlphanumeric: true,  // Ensure SKU is alphanumeric (optional)
    },
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
    validate: {
      isFloat: true,  // Ensure price is a valid number
      min: 0,  // Ensure price is a non-negative value
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,  // Ensure description is not empty
    },
  },
  catItems: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,  // Ensure category is not empty
    },
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,  // Ensure subcategory is not empty
    },
  },
  seller_email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,  // Ensure the email is in the correct format
    },
  },
  image: {
    type: DataTypes.JSON,  // Storing an array of image URLs
    allowNull: true,
    get() {
      const value = this.getDataValue('image');
      return value ? JSON.parse(value) : [];  // Parse the JSON array if it exists
    },
    set(value) {
      this.setDataValue('image', JSON.stringify(value));  // Store the value as a JSON string
    },
  },
  unit_of_measurement: {
    type: DataTypes.STRING,
    allowNull: true,  // Make it optional
  },
  stock: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'limited_stock'),
    allowNull: false,
    defaultValue: 'in_stock',// Default to 'in_stock'
  },
  productfor: {
    types:DataTypes.ENUM('for_seller , for_user'),
    allowNull:false,
    defualtValue:'for_user',
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',  // All products start as 'pending'
  },
}, {
  tableName: 'products',
  timestamps: true,  // Enable timestamps for createdAt and updatedAt fields
  createdAt: 'created_at',  // Custom column name for createdAt
  updatedAt: 'updated_at',  // Custom column name for updatedAt
});

export default AddProduct;
