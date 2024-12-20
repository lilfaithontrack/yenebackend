// models/AssignOrder.js
const { Model, DataTypes } = require('sequelize');
import sequelize from '../db/dbConnect.js'; // Adjust the path to your sequelize instance

class AssignOrder extends Model {}

AssignOrder.init({
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders',  // assuming the Orders model exists
      key: 'id'
    },
    onDelete: 'CASCADE',
  },
  shopper_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Shoppers',  // assuming the Shoppers model exists
      key: 'id'
    },
    onDelete: 'SET NULL',  // In case the shopper is deleted
  },
  delivery_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'DeliveryBoys',  // assuming the DeliveryBoys model exists
      key: 'id'
    },
    onDelete: 'SET NULL',  // In case the delivery boy is deleted
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Assigned',  // 'Assigned', 'In Progress', 'Completed', etc.
  },
  assigned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,  // When the order was assigned
  },
}, {
  sequelize,
  modelName: 'AssignOrder',
  tableName: 'assign_orders',  // You can name your table as you prefer
  timestamps: true,  // Automatically includes createdAt and updatedAt fields
});

module.exports = AssignOrder;
