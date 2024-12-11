import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const Subcat = sequelize.define('Subcat', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Subcategory name cannot be empty',
      },
    },
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'subcats',
});

export default Subcat;
