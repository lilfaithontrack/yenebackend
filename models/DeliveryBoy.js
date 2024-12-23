import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';
import AssignOrder from './AssignOrder.js';
const DeliveryBoy = sequelize.define(
  'DeliveryBoy',
  {
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Full name is required.' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please enter a valid email address.' },
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Location is required.' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required.' },
      },
    },
  },
  {
    tableName: 'delivery_boys',
    timestamps: true,
  }
);
DeliveryBoy.hasMany(Assignment, { foreignKey: 'delivery_boy_id' });

export default DeliveryBoy;
