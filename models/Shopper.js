import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../db/dbConnect.js'; // Ensure Sequelize instance is imported

const Shopper = sequelize.define('Shopper', {
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Full name is required.' },
    },
    field: 'full_name', // Map to database column `full_name`
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email address.' },
    },
  },
  locationLat: {
    type: DataTypes.DOUBLE, // Use DOUBLE to match your SQL schema
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Latitude must be a decimal number.' },
    },
    field: 'location_lat', // Map to database column `location_lat`
  },
  locationLng: {
    type: DataTypes.DOUBLE, // Use DOUBLE to match your SQL schema
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Longitude must be a decimal number.' },
    },
    field: 'location_lng', // Map to database column `location_lng`
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required.' },
    },
  },
}, {
  tableName: 'shoppers', // Table name for the model
  timestamps: true, // Enable `createdAt` and `updatedAt`
  underscored: true, // Use snake_case for database column names
  createdAt: 'created_at', // Map `createdAt` to `created_at`
  updatedAt: 'updated_at', // Map `updatedAt` to `updated_at`
  hooks: {
    beforeCreate: async (shopper) => {
      if (shopper.password) {
        shopper.password = await hashPassword(shopper.password);
      }
    },
    beforeUpdate: async (shopper) => {
      if (shopper.changed('password')) {
        shopper.password = await hashPassword(shopper.password);
      }
    },
  },
});

// Helper function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Password comparison method for login
Shopper.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Define Associations
Shopper.associate = (models) => {
  Shopper.hasMany(models.AssignOrder, { foreignKey: 'shopperId', as: 'assignOrders' });
};

export default Shopper;
