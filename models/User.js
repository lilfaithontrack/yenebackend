import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,  // Auto increment ID
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false,  // Not nullable
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,  // Not nullable
  },
  phone: {
    type: DataTypes.TEXT,
    allowNull: false,  // Not nullable
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,  // Not nullable
  },
  lastsignin: {
    type: DataTypes.DATE,
    defaultValue: sequelize.fn('convert_tz', sequelize.fn('utc_timestamp'), '+00:00', '+03:00'),  // Convert UTC timestamp to GMT+3 timezone
    allowNull: true,  // Nullable
  },
  status: {
    type: DataTypes.TEXT,
    defaultValue: 'Inactive',  // Default to 'Inactive'
    allowNull: true,  // Nullable
  },
}, {
  timestamps: false,  // Disable automatic timestamps (we use 'lastsignin' instead)
  tableName: 'users',  // Matches the table name
});

export default User;
