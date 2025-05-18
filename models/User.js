import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  phone: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lastsignin: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn('convert_tz', sequelize.fn('utc_timestamp'), '+00:00', '+03:00'),
    allowNull: true,
  },
  status: {
    type: DataTypes.TEXT,
    defaultValue: 'Inactive',
    allowNull: true,
  },
  agent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  referral_code: {
    type: DataTypes.STRING,
    allowNull: true, // Only agents will use this
  },
}, {
  timestamps: false,
  tableName: 'users',
});

export default User;
