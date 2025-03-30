import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 255]
    }
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  location_prices: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      return this.getDataValue('location_prices') || {};
    },
    set(value) {
      let prices = typeof value === 'object' ? value : {};
      if (!prices['Addis Ababa']) {
        prices['Addis Ababa'] = this.price;
      }
      this.setDataValue('location_prices', prices);
    }
  },
  location_stock: {
    type: DataTypes.JSON,
    defaultValue: { "Addis Ababa": "in_stock" },
    get() {
      return this.getDataValue('location_stock') || { "Addis Ababa": "in_stock" };
    },
    set(value) {
      const validated = {};
      for (const [loc, status] of Object.entries(value || {})) {
        validated[loc] = ['in_stock', 'out_of_stock', 'limited_stock'].includes(status) 
          ? status 
          : 'in_stock';
      }
      if (!validated['Addis Ababa']) {
        validated['Addis Ababa'] = 'in_stock';
      }
      this.setDataValue('location_stock', validated);
    }
  },
  location_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'Addis Ababa'
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true,
    defaultValue: { type: 'Point', coordinates: [38.74, 9.03] }
  },
  location_radius: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 10
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Product;
