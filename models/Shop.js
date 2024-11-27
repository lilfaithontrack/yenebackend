import { DataTypes } from 'sequelize';
import sequelize from '../db/dbconnect.js';
import ShopOwner from './ShopOwner.js'; // Ensure the path is correct

const Shop = sequelize.define('Shop', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  licenseFile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8), // Precision for lat/long
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'), // Status options
    allowNull: false,
    defaultValue: 'pending',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define relationships with ShopOwner
Shop.belongsTo(ShopOwner, { foreignKey: 'shopOwnerId', onDelete: 'CASCADE' });
ShopOwner.hasMany(Shop, { foreignKey: 'shopOwnerId' });

export default Shop;
