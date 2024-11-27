import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING, // Store image URL or file path
    allowNull: true, // Make this nullable if not required
    defaultValue: null, // Set default to null if no image provided
  },
}, {
  tableName: 'categories',
  timestamps: false,
});

// Define associations
Category.associate = (models) => {
  Category.hasMany(models.Subcategory, {
    foreignKey: 'categoryId',
    as: 'subcategories',
  });
};

export default Category;
