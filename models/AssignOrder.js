import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Adjust the path to your sequelize instance
import Shopper from './Shopper.js';
import DeliveryBoy from './DeliveryBoy.js';
import Payment from './Payment.js';

class AssignOrder extends Model {}

AssignOrder.init(
  {
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders', // Assuming the Orders model exists
        key: 'id',
      },
      onDelete: 'CASCADE', // If an order is deleted, delete associated assignment
    },
    shopper_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Shoppers', // Assuming the Shoppers model exists
        key: 'id',
      },
      onDelete: 'SET NULL', // If a shopper is deleted, set their id to null
    },
    delivery_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DeliveryBoys', // Assuming the DeliveryBoys model exists
        key: 'id',
      },
      onDelete: 'SET NULL', // If a delivery boy is deleted, set their id to null
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Payments', // Reference to the Payments model
        key: 'id',
      },
      onDelete: 'CASCADE', // If payment is deleted, delete associated assignment
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Assigned', // Default value for status (e.g., 'Assigned', 'In Progress', 'Completed')
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Automatically set to the current timestamp when the order is assigned
    },
  },
  {
    sequelize,
    modelName: 'AssignOrder',
    tableName: 'assign_orders', // You can name your table as you prefer
    timestamps: true, // Automatically includes createdAt and updatedAt fields
  }
);

// Define associations after model initialization to avoid circular dependencies
AssignOrder.associate = (models) => {
  // Define a belongsTo association with Shopper (a shopper can be assigned to many orders)
  AssignOrder.belongsTo(models.Shopper, {
    foreignKey: 'shopper_id',
    as: 'shopper', // Alias for the association
  });

  // Define a belongsTo association with DeliveryBoy (a delivery boy can be assigned to many orders)
  AssignOrder.belongsTo(models.DeliveryBoy, {
    foreignKey: 'delivery_id', // Updated to match the column name
    as: 'deliveryBoy', // Alias for the association
  });

  // Define a belongsTo association with Payment (each assignment should be linked to one payment)
  AssignOrder.belongsTo(models.Payment, {
    foreignKey: 'payment_id', // Link the payment_id to the AssignOrder model
    as: 'payment', // Alias for the association
  });
};

export default AssignOrder;
