const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  color: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  size: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  catItems: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subcat: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  image: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      return this.getDataValue('image') || [];
    },
    set(value) {
      this.setDataValue('image', Array.isArray(value) ? value : []);
    }
  },
  unit_of_measurement: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'approved'
  },
  stock: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'limited_stock'),
    defaultValue: 'in_stock'
  },
  productfor: {
    type: DataTypes.ENUM('for_seller', 'for_user'),
    defaultValue: 'for_user'
  },
  sku: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  // Location Features
  location_type: {
    type: DataTypes.ENUM('region', 'coordinates', 'hybrid'),
    defaultValue: 'region'
  },
  location_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  coordinates: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: true
  },
  location_radius: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  location_prices: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      return this.getDataValue('location_prices') || {};
    },
    set(value) {
      this.setDataValue('location_prices', typeof value === 'object' ? value : {});
    }
  },
  location_stock: {
    type: DataTypes.JSON,
    defaultValue: {},
    get() {
      return this.getDataValue('location_stock') || {};
    },
    set(value) {
      const validated = {};
      for (const [loc, status] of Object.entries(value || {})) {
        validated[loc] = ['in_stock', 'out_of_stock', 'limited_stock'].includes(status) 
          ? status 
          : 'in_stock';
      }
      this.setDataValue('location_stock', validated);
    }
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['title'] },
    { fields: ['status', 'stock'] },
    { fields: ['catItems', 'subcat'] },
    { 
      fields: ['coordinates'],
      using: 'SPATIAL' 
    },
    { 
      type: 'FULLTEXT',
      fields: ['title', 'description'] 
    }
  ]
});

// Location Methods
Product.prototype.setLocation = function({ name, lat, lng, radius }) {
  if (lat && lng) {
    this.coordinates = { type: 'Point', coordinates: [lng, lat] };
    this.location_type = name ? 'hybrid' : 'coordinates';
  }
  if (name) this.location_name = name;
  if (radius) this.location_radius = radius;
};

Product.prototype.getCoordinates = function() {
  if (!this.coordinates) return null;
  return {
    lat: this.coordinates.coordinates[1],
    lng: this.coordinates.coordinates[0]
  };
};

module.exports = Product;
