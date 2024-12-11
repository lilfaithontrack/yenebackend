import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';
import SubCat from './SubCat.js';
import CatItem from './CatItem.js';

const AddProduct = sequelize.define(
  'AddProduct',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    sku: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    size: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    brand: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    catItemId: {
      type: DataTypes.INTEGER,
      references: {
        model: CatItem,
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    subCatId: {
      type: DataTypes.INTEGER,
      references: {
        model: SubCat,
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comment_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: 'addproduct',
    timestamps: false, // Disable Sequelize auto timestamps
  }
);

// Associations
AddProduct.belongsTo(CatItem, { foreignKey: 'catItemId' });
CatItem.hasMany(AddProduct, { foreignKey: 'catItemId' });

AddProduct.belongsTo(SubCat, { foreignKey: 'subCatId' });
SubCat.hasMany(AddProduct, { foreignKey: 'subCatId' });

export default AddProduct;
