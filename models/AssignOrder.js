import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; 
import Shopper from './Shopper.js';
import DeliveryBoy from './DeliveryBoy.js';


class AssignOrder extends Model {}

AssignOrder.init(
  {
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    shopper_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Shoppers',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    delivery_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DeliveryBoys',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    payment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Payments',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    tableName: 'assign_orders',
    timestamps: true,
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
