import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Adjust path if necessary

const CatItem = sequelize.define('CatItem', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'CatItem name cannot be empty',
      },
    },
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'cat_items',
});

export default CatItem;
