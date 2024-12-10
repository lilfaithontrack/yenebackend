const { DataTypes } = require('sequelize');
const sequelize = require('../database'); // Adjust path to your Sequelize instance

const Cat = sequelize.define('Cat', {
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Name is required
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false, // Image URL is required
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Null for top-level categories
    references: {
      model: 'Cats', // Self-referential relationship
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('category', 'subcategory'),
    allowNull: false,
    defaultValue: 'category', // Default to 'category'
  },
});

Cat.hasMany(Cat, {
  foreignKey: 'parentId',
  as: 'subcategories',
});

Cat.belongsTo(Cat, {
  foreignKey: 'parentId',
  as: 'parentCategory',
});

module.exports = Cat;
