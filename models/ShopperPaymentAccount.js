// models/ShopperPaymentAccount.js
import { DataTypes } from "sequelize";
import sequelize from '../db/dbConnect.js';
import Shopper from "../../server/models/Shopper.js";

const ShopperPaymentAccount = sequelize.define(
  "ShopperPaymentAccount",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // 🛠️ FIX: Changed the data type to match the 'Shopper' model's primary key
    shopperId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    type: {
      type: DataTypes.ENUM("Bank", "Wallet"),
      allowNull: false,
    },
    accountName: { type: DataTypes.STRING, allowNull: false },
    accountNumber: { type: DataTypes.STRING, allowNull: false },
    provider: { type: DataTypes.STRING },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "shopper_payment_accounts",
    timestamps: true,
  }
);

// Associations
ShopperPaymentAccount.belongsTo(Shopper, { foreignKey: "shopperId" });
Shopper.hasMany(ShopperPaymentAccount, { foreignKey: "shopperId" });


export default ShopperPaymentAccount;
