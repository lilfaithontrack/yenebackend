import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js'; // Adjust path if necessary

const Subcat = sequelize.define('Subcat', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Ensures subcategory names are unique
    validate: {
      notEmpty: {
        msg: 'Subcategory name cannot be empty',
      },
    },
  },
  image: {
    type: DataTypes.STRING, // Store the file path or filename for the uploaded image
    allowNull: true,
    validate: {
      notEmpty: {
        msg: 'Image path cannot be empty if provided',
      },
    },
  },
}, {
  // Add timestamps for tracking creation and updates
  timestamps: true, // Sequelize will automatically add 'createdAt' and 'updatedAt'
  tableName: 'subcats', // Define custom table name if needed
});

export default Subcat;
