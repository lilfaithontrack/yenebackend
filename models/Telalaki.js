// models/Telalaki.js
// All Sequelize models and associations are defined and exported from this single file.

import { Sequelize, DataTypes } from 'sequelize';
// *** IMPORTANT: Adjust this path if Telalaki.js is not in the 'models' directory ***
import sequelize from '../db/dbConnect.js'; // Assuming dbConnect.js is one level up in 'db'

// --- Define Models directly in the module scope and export them ---
export const Sender = sequelize.define('Sender', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Added explicit PK
  full_name: DataTypes.STRING,
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  pin: { // Hashed PIN
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'Senders',
  timestamps: true,
});


export const Vehicle = sequelize.define('Vehicle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Added explicit PK
  // driver_id: { type: DataTypes.INTEGER, references: { model: 'Drivers', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'SET NULL'}, // Optional FK
  owner_full_name: DataTypes.STRING,
  region: DataTypes.STRING,
  zone: DataTypes.STRING,
  district: DataTypes.STRING,
  house_number: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  car_type: DataTypes.STRING,
  car_name: DataTypes.STRING,
  manufacture_year: DataTypes.STRING, // Consider INTEGER
  cargo_capacity: DataTypes.STRING, // Consider FLOAT/DECIMAL
  license_plate: DataTypes.STRING,
  commercial_license: DataTypes.STRING,
  tin_number: DataTypes.STRING,
  car_license_photo: DataTypes.STRING, // URL or path
  owner_id_photo: DataTypes.STRING,    // URL or path
  car_photo: DataTypes.STRING,         // URL or path
  owner_photo: DataTypes.STRING,       // URL or path
}, { tableName: 'Vehicles', timestamps: true });

export const Driver = sequelize.define('Driver', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Added explicit PK
  sender_id: { // Foreign key for Sender (optional link)
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'Senders', key: 'id' },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  full_name: DataTypes.STRING,
  region: DataTypes.STRING,
  zone: DataTypes.STRING,
  district: DataTypes.STRING,
  house_number: DataTypes.STRING,
  phone: DataTypes.STRING, // Consider unique: true
  email: DataTypes.STRING,
  driver_license_photo: DataTypes.STRING, // URL or path
  identification_photo: DataTypes.STRING, // URL or path
  is_owner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  pin: { // Hashed PIN
    type: DataTypes.STRING,
    allowNull: false,
    // Removed validation based on previous request
  },
  // --- Fields for Tracking & Availability (Added/Updated) ---
  current_lat: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  current_lng: {
    type: DataTypes.DOUBLE,
    allowNull: true,
  },
  last_location_update: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  is_available_for_new: { // Can driver accept more requests right now?
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
  current_status: { // Driver's current working status (ENUM updated)
    type: DataTypes.ENUM('offline', 'idle', 'assigned', 'en_route_pickup', 'at_pickup', 'en_route_dropoff', 'at_dropoff', 'busy'),
    defaultValue: 'offline',
    allowNull: false,
  },
}, { tableName: 'Drivers', timestamps: true });

export const AdminApproval = sequelize.define('AdminApproval', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Added explicit PK
  driver_id: { // Foreign key for Driver
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Ensure only one approval per driver
      references: { model: 'Drivers', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejected_reason: {
      type: DataTypes.STRING,
      allowNull: true,
  },
}, { tableName: 'AdminApprovals', timestamps: true });

export const DeliveryRequest = sequelize.define('DeliveryRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Added explicit PK
  sender_id: { // Foreign key for Sender
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Senders', key: 'id' },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  assigned_driver_id: { // Foreign key for Driver
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'Drivers', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
  },
  pickup_lat: { type: DataTypes.DOUBLE, allowNull: false },
  pickup_lng: { type: DataTypes.DOUBLE, allowNull: false },
  dropoff_lat: { type: DataTypes.DOUBLE, allowNull: false },
  dropoff_lng: { type: DataTypes.DOUBLE, allowNull: false },
  status: { // ENUM Updated
    type: DataTypes.ENUM(
        'pending', 'broadcasting', 'assigned', 'driver_confirmed', 'en_route_pickup',
        'at_pickup', 'en_route_dropoff', 'at_dropoff', 'delivered',
        'cancelled_sender', 'cancelled_driver', 'cancelled_admin'
       ),
    defaultValue: 'pending',
    allowNull: false,
  },
  payment_proof_image: { // ስሙን ይቀይሩ
    type: DataTypes.STRING, // ወይም DataTypes.TEXT እንደ አስፈላጊነቱ
    allowNull: true
},
  bank_account:{type: DataTypes.ENUM('Cbe','Telebirr','Abyssinia')},
  delivery_time: { type: DataTypes.DATE, allowNull: true }, // Actual completion time
  weight: { type: DataTypes.FLOAT, allowNull: true },
  size: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: true }, // Calculated price
  payment_method: { type: DataTypes.ENUM('screenshot', 'cash'), defaultValue: 'cash' },
  payment_proof_url: { type: DataTypes.STRING, allowNull: true }, // Path/URL from upload
  receipt_link: { type: DataTypes.STRING, allowNull: true },
  is_payment_approved: { type: DataTypes.BOOLEAN, defaultValue: false },
  vehicle: {type: DataTypes.STRING, allowNull: true},
  approved_by: { type: DataTypes.ENUM('admin', 'driver'), allowNull: true },
  receiver_name:{type: DataTypes.STRING, allowNull: true},
  receiver_phone:{type: DataTypes.STRING, allowNull: true},
  
  pickup_sequence: { type: DataTypes.INTEGER, allowNull: true },
  dropoff_sequence: { type: DataTypes.INTEGER, allowNull: true },
  estimated_pickup_time: { type: DataTypes.DATE, allowNull: true },
  estimated_dropoff_time: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'DeliveryRequests', timestamps: true });

export const DynamicPricing = sequelize.define('DynamicPricing', {
    id: { // Explicit PK with default 1
       type: DataTypes.INTEGER,
       primaryKey: true,
       autoIncrement: false,
       defaultValue: 1
    },
  // Added Default Values
  price_per_km: { type: DataTypes.FLOAT, defaultValue: 15.0 },
  price_per_kg: { type: DataTypes.FLOAT, defaultValue: 12.0 },
  price_per_size_unit: { type: DataTypes.FLOAT, defaultValue: 12.0 },
  price_per_quantity: { type: DataTypes.FLOAT, defaultValue: 3.0 },
  // base_fee: { type: DataTypes.FLOAT, defaultValue: 50.0 }, // Example
  // minimum_charge: { type: DataTypes.FLOAT, defaultValue: 75.0 } // Example
}, { tableName: 'DynamicPricing', timestamps: false }); // Timestamps likely not needed

export const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, // Added explicit PK
  sender_id: { // FK for Sender
    type: DataTypes.INTEGER, allowNull: true, references: { model: 'Senders', key: 'id' },
    onDelete: 'CASCADE', onUpdate: 'CASCADE'
  },
  driver_id: { // FK for Driver
    type: DataTypes.INTEGER, allowNull: true, references: { model: 'Drivers', key: 'id' },
    onDelete: 'CASCADE', onUpdate: 'CASCADE'
  },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: true }, // Category like 'broadcast_request'
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  read_at: { type: DataTypes.DATE, allowNull: true },
  related_entity_id: { type: DataTypes.INTEGER, allowNull: true }, // Link to DeliveryRequest ID etc.
  related_entity_type: { type: DataTypes.STRING, allowNull: true }, // e.g., 'DeliveryRequest'
}, { tableName: 'Notifications', timestamps: true });


// --- Define Relationships (Using explicit aliases) ---
Sender.hasOne(Driver, { foreignKey: 'sender_id', onDelete: 'SET NULL', onUpdate: 'CASCADE', as: 'driverProfile' });
Driver.belongsTo(Sender, { foreignKey: 'sender_id', as: 'senderAccount' });

Driver.hasOne(AdminApproval, { foreignKey: 'driver_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'approvalStatus' });
AdminApproval.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

Sender.hasMany(DeliveryRequest, { foreignKey: 'sender_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'deliveryRequests' });
DeliveryRequest.belongsTo(Sender, { foreignKey: 'sender_id', as: 'sender' });

Driver.hasMany(DeliveryRequest, { foreignKey: 'assigned_driver_id', onDelete: 'SET NULL', onUpdate: 'CASCADE', as: 'assignedDeliveries' });
DeliveryRequest.belongsTo(Driver, { foreignKey: 'assigned_driver_id', as: 'assignedDriver' });

Sender.hasMany(Notification, { foreignKey: 'sender_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'notifications' });
Notification.belongsTo(Sender, { foreignKey: 'sender_id', as: 'recipientSender' });

Driver.hasMany(Notification, { foreignKey: 'driver_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'notifications' });
Notification.belongsTo(Driver, { foreignKey: 'driver_id', as: 'recipientDriver' });

// --- Exports ---
export { sequelize, Sequelize };
