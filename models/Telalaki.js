// telalaki.js
// All Sequelize models and associations are defined and exported from this single file.

import { Sequelize, DataTypes } from 'sequelize';
// *** IMPORTANT: Adjust this path if telalaki.js is not in the 'models' directory ***
import sequelize from '../db/dbConnect.js'; // Assuming dbConnect.js is one level up in 'db'

// --- Define Models directly in the module scope and export them ---

export const Sender = sequelize.define('Sender', {
  full_name: DataTypes.STRING,
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  pin: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [4, 4]
    },
    // SECURITY WARNING: This field MUST be hashed before saving to the DB!
    // Use a library like bcrypt in your application logic.
  },
}, {
  // Optional table options like timestamps (default true) or specific table name
  // tableName: 'Senders'
});

export const Vehicle = sequelize.define('Vehicle', {
  owner_full_name: DataTypes.STRING,
  region: DataTypes.STRING,
  zone: DataTypes.STRING,
  district: DataTypes.STRING,
  house_number: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING, // Consider adding { validate: { isEmail: true } }
  car_type: DataTypes.STRING,
  car_name: DataTypes.STRING,
  manufacture_year: DataTypes.STRING, // Consider DataTypes.INTEGER
  cargo_capacity: DataTypes.STRING, // Consider DataTypes.FLOAT or DECIMAL for calculations
  license_plate: DataTypes.STRING,
  commercial_license: DataTypes.STRING,
  tin_number: DataTypes.STRING,
  car_license_photo: DataTypes.STRING, // URL or path
  owner_id_photo: DataTypes.STRING,    // URL or path
  car_photo: DataTypes.STRING,         // URL or path
  owner_photo: DataTypes.STRING,       // URL or path
});

export const Driver = sequelize.define('Driver', {
  sender_id: { // Foreign key for Sender (establishes the optional link if a driver is also a sender)
    type: DataTypes.INTEGER,
    allowNull: true, // Driver might not be a Sender
    // unique: true // Handled by the 1:1 association definition below
  },
  full_name: DataTypes.STRING,
  region: DataTypes.STRING,
  zone: DataTypes.STRING,
  district: DataTypes.STRING,
  house_number: DataTypes.STRING,
  phone: DataTypes.STRING, // Consider making unique or adding validation
  email: DataTypes.STRING, // Consider adding { validate: { isEmail: true } }
  driver_license_photo: DataTypes.STRING, // URL or path
  identification_photo: DataTypes.STRING, // URL or path
  is_owner: { // Is the driver also the vehicle owner?
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  pin: { // Added PIN for Driver
    type: DataTypes.STRING, // Store as string for hashing
    allowNull: false,
    validate: {
      isNumeric: true,
      len: [6, 6]
    },
    // SECURITY WARNING: This field MUST be hashed before saving to the DB!
  },
  // --- Fields for Tracking & Availability ---
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
  current_status: { // Driver's current working status
    type: DataTypes.ENUM('offline', 'idle', 'en_route_pickup', 'en_route_dropoff', 'busy'),
    defaultValue: 'offline',
    allowNull: false,
  },
});

export const AdminApproval = sequelize.define('AdminApproval', {
  driver_id: { // Foreign key for Driver
      type: DataTypes.INTEGER,
      allowNull: false, // An approval record must belong to a driver
      // unique: true // Handled by the 1:1 association
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true, // Only set when approved
  },
  rejected_reason: {
      type: DataTypes.STRING,
      allowNull: true, // Only set when rejected
  },
});

export const DeliveryRequest = sequelize.define('DeliveryRequest', {
  sender_id: { // Foreign key for Sender (the customer)
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assigned_driver_id: { // Foreign key for Driver handling this request
      type: DataTypes.INTEGER,
      allowNull: true, // Null until assigned
  },
  pickup_lat: {
      type: DataTypes.DOUBLE,
      allowNull: false,
  },
  pickup_lng: {
      type: DataTypes.DOUBLE,
      allowNull: false,
  },
  dropoff_lat: {
      type: DataTypes.DOUBLE,
      allowNull: false,
  },
  dropoff_lng: {
      type: DataTypes.DOUBLE,
      allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
        'pending', 'assigned', 'driver_confirmed', 'en_route_pickup',
        'at_pickup', 'en_route_dropoff', 'at_dropoff', 'delivered',
        'cancelled_sender', 'cancelled_driver', 'cancelled_admin'
       ),
    defaultValue: 'pending',
    allowNull: false,
  },
  delivery_time: { // Actual time of delivery completion
      type: DataTypes.DATE,
      allowNull: true,
  },
  weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
  },
  size: { // e.g., 'small', 'medium', 'large', or dimensions '10x20x5'
      type: DataTypes.STRING,
      allowNull: true,
  },
  quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  price: {
      type: DataTypes.FLOAT,
      allowNull: true, // Or false if price is always calculated upfront
  },
  payment_method: {
    type: DataTypes.ENUM('screenshot', 'cash'), // Or 'card', 'wallet' etc.
    defaultValue: 'cash',
  },
  payment_proof_url: { // URL or path for screenshot
      type: DataTypes.STRING,
      allowNull: true,
  },
  receipt_link: { // Link to a generated receipt (optional)
      type: DataTypes.STRING,
      allowNull: true,
  },
  is_payment_approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  approved_by: {
    type: DataTypes.ENUM('admin', 'driver'),
    allowNull: true, // Who confirmed the payment (if screenshot)
  },
  // --- Fields for Multi-stop Sequencing ---
  pickup_sequence: { // Order for pickup if driver has multiple pickups (1st, 2nd, etc.)
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  dropoff_sequence: { // Order for dropoff if driver has multiple dropoffs
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  estimated_pickup_time: { // Calculated ETA for pickup
      type: DataTypes.DATE,
      allowNull: true,
  },
  estimated_dropoff_time: { // Calculated ETA for dropoff
      type: DataTypes.DATE,
      allowNull: true,
  },
});

export const DynamicPricing = sequelize.define('DynamicPricing', {
  price_per_km: DataTypes.FLOAT,
  price_per_kg: DataTypes.FLOAT,
  price_per_size_unit: DataTypes.FLOAT, // Define 'size_unit' (e.g., cubic meter)
  price_per_quantity: DataTypes.FLOAT, // If quantity affects price beyond weight/size
  // Consider adding region/zone/vehicle_type FKs if needed
});

export const Notification = sequelize.define('Notification', {
  sender_id: { // FK for the Sender receiving the notification
    type: DataTypes.INTEGER,
    allowNull: true, // Notification might be for driver OR sender
  },
  driver_id: { // FK for the Driver receiving the notification
    type: DataTypes.INTEGER,
    allowNull: true, // Notification might be for sender OR driver
  },
  message: { // The notification content
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: { // Categorize notifications
    type: DataTypes.STRING, // Or ENUM('delivery_update', 'payment', 'approval', 'new_request', 'route_update', 'general')
    allowNull: true,
  },
  is_read: { // Has the notification been read?
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  read_at: { // Optional: When the notification was marked as read
      type: DataTypes.DATE,
      allowNull: true,
  },
  related_entity_id: { // Optional: Link to a specific entity (e.g., a DeliveryRequest ID)
      type: DataTypes.INTEGER,
      allowNull: true,
  },
  related_entity_type: { // e.g., 'DeliveryRequest', 'AdminApproval'
      type: DataTypes.STRING,
      allowNull: true,
  }
  // Add validation/constraint in application logic or DB to ensure sender_id OR driver_id is set
});


// --- Define Relationships (after all models are defined and exported) ---

// Sender <-> Driver (One-to-One, optional: a Sender can have a Driver profile)
Sender.hasOne(Driver, { foreignKey: 'sender_id', onDelete: 'SET NULL', onUpdate: 'CASCADE', as: 'driverProfile' });
Driver.belongsTo(Sender, { foreignKey: 'sender_id', as: 'senderAccount' }); // A Driver *can* belong to a Sender account

// Driver <-> AdminApproval (One-to-One, required: a Driver must have an approval status)
Driver.hasOne(AdminApproval, { foreignKey: 'driver_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'approvalStatus' });
AdminApproval.belongsTo(Driver, { foreignKey: 'driver_id', as: 'driver' });

// Sender <-> DeliveryRequest (One-to-Many)
Sender.hasMany(DeliveryRequest, { foreignKey: 'sender_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'deliveryRequests' });
DeliveryRequest.belongsTo(Sender, { foreignKey: 'sender_id', as: 'sender' });

// Driver <-> DeliveryRequest (One-to-Many)
Driver.hasMany(DeliveryRequest, { foreignKey: 'assigned_driver_id', onDelete: 'SET NULL', onUpdate: 'CASCADE', as: 'assignedDeliveries' });
DeliveryRequest.belongsTo(Driver, { foreignKey: 'assigned_driver_id', as: 'assignedDriver' });

// Sender <-> Notification (One-to-Many)
Sender.hasMany(Notification, { foreignKey: 'sender_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'notifications' });
Notification.belongsTo(Sender, { foreignKey: 'sender_id', as: 'recipientSender' });

// Driver <-> Notification (One-to-Many)
Driver.hasMany(Notification, { foreignKey: 'driver_id', onDelete: 'CASCADE', onUpdate: 'CASCADE', as: 'notifications' });
Notification.belongsTo(Driver, { foreignKey: 'driver_id', as: 'recipientDriver' });

// Optional: Vehicle Relationships
// If a driver *must* have one vehicle:
// Driver.hasOne(Vehicle, { foreignKey: 'driverId', as: 'vehicle' }); // Add driverId to Vehicle
// Vehicle.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
// If a driver can have multiple vehicles:
// Driver.hasMany(Vehicle, { foreignKey: 'driverId', as: 'vehicles' }); // Add driverId to Vehicle
// Vehicle.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
// If a vehicle is owned by a Sender (who might not be the driver):
// Sender.hasMany(Vehicle, { foreignKey: 'ownerSenderId', as: 'vehicles' }); // Add ownerSenderId to Vehicle
// Vehicle.belongsTo(Sender, { foreignKey: 'ownerSenderId', as: 'owner' });


// --- Optionally export sequelize instance and Sequelize library ---
// Useful for transactions, raw queries, Op, etc. in your controllers/services
export { sequelize, Sequelize };
