
import { DataTypes } from 'sequelize';
import sequelize from '../config/database'; // Adjust path if necessary

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
    type: DataTypes.STRING, // Store the image URL/path or filename
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Image must be a valid URL if provided',
      },
    },
  },
}, {
  // Add timestamps for tracking creation and updates
  timestamps: true, // Sequelize will automatically add 'createdAt' and 'updatedAt'
  tableName: 'subcats', // Define custom table name if needed
});

export default Subcat;
