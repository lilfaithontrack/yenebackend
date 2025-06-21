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
    allowNull: true,
  },
  referred_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  account_number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  is_company: {
  type: DataTypes.BOOLEAN,
  allowNull: false,
  defaultValue: false,
},

  wallet_balance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'users',
});

export default User;
