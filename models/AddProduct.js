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
      notEmpty: true,  // Ensure categoryId is an integer
    },
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,  // Ensure subcategoryId is an integer
    },
  },
  seller_email: {
    type: DataTypes.STRING,
    allowNull: false,
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
    type: DataTypes.INTEGER,
    allowNull: true,  // Make it optional
    validate: {
      min: 0,  // Ensure stock is not negative
    },
  },
}, {
  tableName: 'products',
  timestamps: true,  // Enable timestamps for createdAt and updatedAt fields
  createdAt: 'created_at',  // Custom column name for createdAt
  updatedAt: 'updated_at',  // Custom column name for updatedAt
});

export default AddProduct;
