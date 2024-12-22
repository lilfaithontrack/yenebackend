import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Adjust the path to your sequelize instance

const AssignOrder = sequelize.define('AssignOrder', {
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Orders', // Assuming the Orders model exists
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  shopperId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'shoppers', // Correct table name 'shoppers'
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  deliveryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'deliveryboys', // Correct table name 'deliveryboys'
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Assigned',
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'assign_orders', // Table name for the AssignOrder model
  timestamps: true, // Enable `createdAt` and `updatedAt`
  underscored: true, // Use snake_case for database column names
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Association setup
AssignOrder.associate = (models) => {
  AssignOrder.belongsTo(models.shoppers, {
    foreignKey: 'shopperId', // Foreign key to shoppers
    as: 'shopper',  // Alias to use in include
  });

  AssignOrder.belongsTo(models.deliveryboys, {
    foreignKey: 'deliveryId', // Foreign key to deliveryboys
    as: 'deliveryBoy',  // Alias to use in include
  });
};

export default AssignOrder;
