import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Import your Sequelize instance
import Shopper from './Shopper.js';
import DeliveryBoy from './DeliveryBoy.js';

class AssignOrder extends Model {}

AssignOrder.init(
  {
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Payments', // References the Payments table
        key: 'id', // Payment ID in the Payments table
      },
      onDelete: 'CASCADE', // If a Payment is deleted, remove related assignments
    },
    shopper_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Shoppers', // References the Shoppers table
        key: 'id', // Shopper ID in the Shoppers table
      },
      onDelete: 'SET NULL', // Set to NULL if the Shopper is deleted
    },
    delivery_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DeliveryBoys', // References the DeliveryBoys table
        key: 'id', // Delivery Boy ID in the DeliveryBoys table
      },
      onDelete: 'SET NULL', // Set to NULL if the Delivery Boy is deleted
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Assigned', // Default status is "Assigned"
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Automatically set to the current timestamp
    },
  },
  {
    sequelize, // Pass your Sequelize instance
    modelName: 'AssignOrder', // Model name
    tableName: 'assign_orders', // Table name in the database
    timestamps: true, // Enable createdAt and updatedAt fields
  }
);

// Associations after model initialization
AssignOrder.associate = (models) => {
  AssignOrder.belongsTo(models.Shopper, {
    foreignKey: 'shopper_id',
    as: 'shopper',
  });

  AssignOrder.belongsTo(models.DeliveryBoy, {
    foreignKey: 'delivery_id',
    as: 'deliveryBoy',
  });
};

export default AssignOrder;
