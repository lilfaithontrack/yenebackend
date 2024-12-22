import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Adjust the path to your sequelize instance

class Shopper extends Model {}

Shopper.init(
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
      unique: true,  // Ensures email is unique
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location_lat: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    location_lng: {
      type: DataTypes.DOUBLE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.TIMESTAMP,
      defaultValue: DataTypes.NOW,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.TIMESTAMP,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Shopper',
    tableName: 'shoppers', // Ensuring the table name is correct
    timestamps: false, // We will manually handle created_at and updated_at columns
  }
);

export default Shopper;
