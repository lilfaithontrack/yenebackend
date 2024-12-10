import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const AddProduct = sequelize.define('AddProduct', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
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
  category: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ordered_at: {
    type: DataTypes.DATE,
    defaultValue: sequelize.literal("convert_tz(utc_timestamp(),'+00:00','+03:00')"),
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
  },
  Active_Quantity: {
    type: DataTypes.INTEGER,
    defaultValue: sequelize.col('quantity'),
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
  subcategory: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  product_comments: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
}, {
  tableName: 'addproduct',
  timestamps: false,
});

export default AddProduct;
