import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  email: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  image: {
    type: DataTypes.TEXT,
    defaultValue: 'admin1.jpg',
  },
}, {
  timestamps: false,
});

export default Delivery;
