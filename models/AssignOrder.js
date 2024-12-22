import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Adjust the path to your sequelize instance

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
      onDelete: 'CASCADE',
    },
    shopper_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shoppers', // Correct table name 'shoppers'
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    delivery_id: {
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
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'AssignOrder',
    tableName: 'assign_orders', // Table name for the AssignOrder model
    timestamps: true,
  }
);

// Association setup
AssignOrder.associate = (models) => {
  AssignOrder.belongsTo(models.shoppers, { // Reference correct plural table name
    foreignKey: 'shopper_id', // Foreign key to shoppers
    as: 'shopper',  // Alias to use in include
  });

  AssignOrder.belongsTo(models.deliveryboys, { // Reference the correct plural table name 'deliveryboys'
    foreignKey: 'delivery_id', // Foreign key to deliveryboys
    as: 'deliveryBoy',  // Alias to use in include
  });
};

export default AssignOrder;
