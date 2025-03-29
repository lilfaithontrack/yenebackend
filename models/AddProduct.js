import { DataTypes } from 'sequelize';
import sequelize from '../db/dbConnect.js';

const AddProduct = sequelize.define('AddProduct', {
  // Basic Product Information
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Product title cannot be empty'
      },
      len: {
        args: [2, 255],
        msg: 'Title must be between 2 and 255 characters'
      }
    }
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isAlphanumeric: {
        msg: 'SKU can only contain letters and numbers'
      }
    }
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },

  // Pricing Information
  basePrice: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isFloat: {
        msg: 'Price must be a valid number'
      },
      min: {
        args: [0],
        msg: 'Price cannot be negative'
      }
    }
  },

  // Location Configuration
  locationType: {
    type: DataTypes.ENUM('region', 'coordinates', 'hybrid'),
    allowNull: false,
    defaultValue: 'region'
  },
  locationName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Human-readable location identifier'
  },
  coordinates: {
    type: DataTypes.GEOGRAPHY('POINT', 4326),
    allowNull: true,
    comment: 'WGS-84 coordinates (longitude, latitude)'
  },
  locationRadius: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Applicable radius in kilometers for regional products'
  },

  // Location-Based Pricing
  locationPrices: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    validate: {
      isValidLocationPrices(value) {
        if (typeof value !== 'object') {
          throw new Error('Location prices must be an object');
        }
        for (const [key, price] of Object.entries(value)) {
          if (typeof price !== 'number' || price < 0) {
            throw new Error(`Invalid price for location ${key}`);
          }
        }
      }
    }
  },

  // Inventory Management
  globalStock: {
    type: DataTypes.ENUM('in_stock', 'out_of_stock', 'limited_stock'),
    allowNull: false,
    defaultValue: 'in_stock'
  },
  locationStock: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    validate: {
      isValidLocationStock(value) {
        if (typeof value !== 'object') {
          throw new Error('Location stock must be an object');
        }
        const validStatuses = new Set(['in_stock', 'out_of_stock', 'limited_stock']);
        for (const [key, status] of Object.entries(value)) {
          if (!validStatuses.has(status)) {
            throw new Error(`Invalid stock status for location ${key}`);
          }
        }
      }
    }
  },
  quantityAvailable: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },

  // Product Details
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [20, 2000]
    }
  },
  catItems: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subcat: {
    type: DataTypes.STRING,
    allowNull: false
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidImages(value) {
        if (!Array.isArray(value)) {
          throw new Error('Images must be an array');
        }
        value.forEach(url => {
          if (!validator.isURL(url, { protocols: ['http', 'https'] })) {
            throw new Error(`Invalid image URL: ${url}`);
          }
        });
      }
    }
  },

  // Seller Information
  sellerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  sellerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },

  // Product Status
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'archived'),
    allowNull: false,
    defaultValue: 'draft'
  },
  approvalDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: 'products',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      name: 'product_coordinates_idx',
      fields: [sequelize.fn('ST_X', sequelize.col('coordinates'))],
      where: {
        coordinates: {
          [sequelize.Op.ne]: null
        }
      }
    },
    {
      name: 'product_location_name_idx',
      fields: ['locationName'],
      where: {
        locationName: {
          [sequelize.Op.ne]: null
        }
      }
    },
    {
      name: 'product_seller_idx',
      fields: ['sellerId']
    },
    {
      name: 'product_status_idx',
      fields: ['status']
    }
  ],
  hooks: {
    beforeSave: (product) => {
      if (product.changed('coordinates') && product.coordinates) {
        product.locationType = product.locationName ? 'hybrid' : 'coordinates';
      }
    }
  }
});

// ======================
// INSTANCE METHODS
// ======================

/**
 * Set geographic coordinates for the product
 * @param {number} latitude - Geographic latitude
 * @param {number} longitude - Geographic longitude
 */
AddProduct.prototype.setCoordinates = function(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new Error('Coordinates must be numbers');
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Invalid coordinates range');
  }
  this.coordinates = { type: 'Point', coordinates: [longitude, latitude] };
  this.locationType = this.locationName ? 'hybrid' : 'coordinates';
};

/**
 * Get coordinates in {lat, lng} format
 * @returns {Object|null} Coordinates object or null if not set
 */
AddProduct.prototype.getCoordinates = function() {
  if (!this.coordinates) return null;
  return {
    lat: this.coordinates.coordinates[1],
    lng: this.coordinates.coordinates[0]
  };
};

/**
 * Set price for a specific location
 * @param {string} locationIdentifier - Region name or coordinate string
 * @param {number} price - Location-specific price
 */
AddProduct.prototype.setLocationPrice = function(locationIdentifier, price) {
  if (typeof price !== 'number' || price < 0) {
    throw new Error('Price must be a positive number');
  }
  const prices = { ...this.locationPrices };
  prices[locationIdentifier] = price;
  this.locationPrices = prices;
};

/**
 * Get price for a specific location
 * @param {string} locationIdentifier - Region name or coordinate string
 * @returns {number} Location-specific price or base price
 */
AddProduct.prototype.getPriceForLocation = function(locationIdentifier) {
  return this.locationPrices[locationIdentifier] || this.basePrice;
};

/**
 * Set stock status for a location
 * @param {string} locationIdentifier - Region name or coordinate string
 * @param {string} status - Stock status (in_stock|out_of_stock|limited_stock)
 */
AddProduct.prototype.setLocationStock = function(locationIdentifier, status) {
  const validStatuses = ['in_stock', 'out_of_stock', 'limited_stock'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }
  const stock = { ...this.locationStock };
  stock[locationIdentifier] = status;
  this.locationStock = stock;
};

/**
 * Get stock status for a location
 * @param {string} locationIdentifier - Region name or coordinate string
 * @returns {string} Location-specific status or global status
 */
AddProduct.prototype.getStockForLocation = function(locationIdentifier) {
  return this.locationStock[locationIdentifier] || this.globalStock;
};

/**
 * Check if product is available in a geographic location
 * @param {number} latitude - Target latitude
 * @param {number} longitude - Target longitude
 * @param {number} [radius] - Search radius in km
 * @returns {Promise<boolean>} Whether product is available
 */
AddProduct.prototype.isAvailableAtLocation = async function(latitude, longitude, radius = 10) {
  if (!this.coordinates) {
    // Fallback to location name if no coordinates
    return !!this.locationName;
  }

  const distance = await sequelize.query(
    `SELECT ST_Distance(
      ST_MakePoint(:lng, :lat)::geography,
      coordinates::geography
    ) / 1000 AS distance
    FROM products
    WHERE id = :productId`,
    {
      replacements: {
        lng: longitude,
        lat: latitude,
        productId: this.id
      },
      type: sequelize.QueryTypes.SELECT
    }
  );

  return distance[0].distance <= radius;
};

// ======================
// CLASS METHODS
// ======================

/**
 * Find products available near a location
 * @param {number} latitude - Center point latitude
 * @param {number} longitude - Center point longitude
 * @param {number} radius - Search radius in kilometers
 * @param {object} [options] - Additional query options
 * @returns {Promise<AddProduct[]>} Array of matching products
 */
AddProduct.findNearLocation = function(latitude, longitude, radius = 10, options = {}) {
  return this.findAll({
    ...options,
    where: {
      ...options.where,
      coordinates: sequelize.where(
        sequelize.fn(
          'ST_DWithin',
          sequelize.col('coordinates'),
          sequelize.fn('ST_MakePoint', longitude, latitude),
          radius * 1000 // Convert km to meters
        ),
        true
      )
    },
    order: [
      [
        sequelize.literal(
          `ST_Distance(coordinates, ST_MakePoint(${longitude}, ${latitude})`
        ),
        'ASC'
      ]
    ]
  });
};

export default AddProduct;
