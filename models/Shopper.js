import { DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';
import sequelize from '../db/dbConnect.js'; // Ensure Sequelize instance is imported

const Shopper = sequelize.define('Shopper', {
  full_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Full name is required.' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please enter a valid email address.' },
    },
  },
  location_lat: {
    type: DataTypes.DECIMAL(10, 8), // 10 digits, 8 after the decimal
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Latitude must be a decimal number.' },
    },
  },
  location_lng: {
    type: DataTypes.DECIMAL(11, 8), // 11 digits, 8 after the decimal
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Longitude must be a decimal number.' },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required.' },
    },
  },
}, {
  tableName: 'shoppers',
  timestamps: true,
  hooks: {
    beforeCreate: async (shopper) => {
      if (shopper.password) {
        // Hash the password before storing it
        const salt = await bcrypt.genSalt(10);
        shopper.password = await bcrypt.hash(shopper.password, salt);
      }
    },
    beforeUpdate: async (shopper) => {
      if (shopper.changed('password')) {
        // Rehash the new password on update
        const salt = await bcrypt.genSalt(10);
        shopper.password = await bcrypt.hash(shopper.password, salt);
      }
    },
  },
});

// Password comparison method for login
Shopper.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default Shopper;
