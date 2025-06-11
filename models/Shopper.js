import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const Shopper = sequelize.define(
  'Shopper',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_lat: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  session_token: {
  type: DataTypes.STRING,
  allowNull: true,
  unique: true,
},
    location_lng: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Shopper',
    tableName: 'shoppers',
    timestamps: true, // Automatically adds createdAt and updatedAt
    underscored: true, // Creates columns as created_at, updated_at
  }
);

export default Shopper;
