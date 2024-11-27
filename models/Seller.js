import { DataTypes } from 'sequelize';
import sequelize from '../db/dbconnect.js'; // Ensure the path is correct and ends with .js

const Seller = sequelize.define('Seller', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lname: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  region: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sub_city: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  woreda: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  liyu_name: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  liyu_sign: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  home_phone: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tin_num: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bank_name: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  account_number: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  national_id: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  verification: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  image: {
    type: DataTypes.TEXT,
    defaultValue: 'admin1.jpg',
  },
  registered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  status: {
    type: DataTypes.TEXT,
    defaultValue: 'Unverified',
  },
  commerce1: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  commerce2: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tin_doc: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'seller',
  timestamps: false, // Disable automatic timestamps
});

export default Seller;
