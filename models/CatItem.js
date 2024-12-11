import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Adjust path if necessary
import Subcat from './Subcat.js'; // Import Subcat model

const CatItem = sequelize.define('CatItem', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensures CatItem names are unique
    validate: {
      notEmpty: {
        msg: 'CatItem name cannot be empty',
      },
    },
  },
  image: {
    type: DataTypes.STRING, // Store the image URL/path or filename
    allowNull: true,
  },
}, {
  timestamps: true, // Sequelize will automatically add 'createdAt' and 'updatedAt'
  tableName: 'cat_items', // Define custom table name if needed
});

// Association: CatItem belongs to Subcat
CatItem.belongsTo(Subcat, {
  foreignKey: 'subcatId', // Add `subcatId` column in `CatItem` table
  as: 'subcat', // Alias for accessing the Subcat relation
});

export default CatItem;
