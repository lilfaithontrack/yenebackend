// models/index.js
import sequelize from '../db/dbConnect.js'; // Assuming this path is correct
import { DataTypes } from 'sequelize';

export default (sequelize, DataTypes) => {
  // Define Sender model
  const Sender = sequelize.define('Sender', {
    full_name: DataTypes.STRING,
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false, // Usually phone number is required
    },
    pin: { // Added PIN for Sender
      type: DataTypes.STRING, // Store as string to preserve leading zeros and for hashing
      allowNull: false,
      validate: {
        isNumeric: true, // Ensure it's composed of digits
        len: [4, 4]      // Ensure it's exactly 4 digits long
      },
      // SECURITY WARNING: This field MUST be hashed before saving to the DB!
      // Use a library like bcrypt in your application logic.
    },
  }, {
      // Optional: Add table options like timestamps true (default) or table name
      // tableName: 'Senders'
  });

  // Define Vehicle model
  const Vehicle = sequelize.define('Vehicle', {
    // Assuming Vehicle is associated perhaps with a Driver or Sender later if needed
    // If Vehicle belongs to a Driver who isn't the owner, adjust FKs as needed
    owner_full_name: DataTypes.STRING,
    region: DataTypes.STRING,
    zone: DataTypes.STRING,
    district: DataTypes.STRING,
    house_number: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING, // Consider adding isEmail validation
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

  // Define Driver model
  const Driver = sequelize.define('Driver', {
    sender_id: { // Foreign key for Sender (establishes the link)
      type: DataTypes.INTEGER,
      // unique: true // Handled by the 1:1 association definition below
      // allowNull defaults to true if not specified
    },
    full_name: DataTypes.STRING,
    region: DataTypes.STRING,
    zone: DataTypes.STRING,
    district: DataTypes.STRING,
    house_number: DataTypes.STRING,
    phone: DataTypes.STRING, // Consider making unique or adding validation
    email: DataTypes.STRING, // Consider adding isEmail validation
    driver_license_photo: DataTypes.STRING, // URL or path
    identification_photo: DataTypes.STRING, // URL or path
    is_owner: { // Is the driver also the vehicle owner? Useful info.
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pin: { // Added PIN for Driver
      type: DataTypes.STRING, // Store as string for hashing
      allowNull: false,
      validate: {
        isNumeric: true, // Ensure it's composed of digits
        len: [6, 6]      // Ensure it's exactly 6 digits long
      },
      // SECURITY WARNING: This field MUST be hashed before saving to the DB!
      // Use a library like bcrypt in your application logic.
    },
    // --- Fields for Tracking & Availability ---
    current_lat: {
      type: DataTypes.DOUBLE, // Match DB schema for precision
      allowNull: true,
    },
    current_lng: {
      type: DataTypes.DOUBLE, // Match DB schema for precision
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
    // ---------------------------------------
  });

  // Define AdminApproval model
  const AdminApproval = sequelize.define('AdminApproval', {
    driver_id: { // Foreign key for Driver
        type: DataTypes.INTEGER,
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

  // Define DeliveryRequest model
  const DeliveryRequest = sequelize.define('DeliveryRequest', {
    sender_id: { // Foreign key for Sender (the customer)
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // --- Driver Assignment ---
    assigned_driver_id: { // Foreign key for Driver handling this request
        type: DataTypes.INTEGER,
        allowNull: true, // Null until assigned
    },
    // ------------------------
    pickup_lat: {
        type: DataTypes.DOUBLE, // Match DB schema
        allowNull: false,
        // validate: { isFloat: true } // Basic validation
    },
    pickup_lng: {
        type: DataTypes.DOUBLE, // Match DB schema
        allowNull: false,
        // validate: { isFloat: true }
    },
    dropoff_lat: {
        type: DataTypes.DOUBLE, // Match DB schema
        allowNull: false,
        // validate: { isFloat: true }
    },
    dropoff_lng: {
        type: DataTypes.DOUBLE, // Match DB schema
        allowNull: false,
        // validate: { isFloat: true }
    },
    status: {
      type: DataTypes.ENUM( // Expanded statuses
          'pending',           // Request created, awaiting assignment
          'assigned',          // Driver assigned, not yet confirmed/moving
          'driver_confirmed',  // Driver acknowledged assignment
          'en_route_pickup',   // Driver heading to pickup location
          'at_pickup',         // Driver arrived at pickup location
          'en_route_dropoff',  // Driver has package(s), heading to dropoff
          'at_dropoff',        // Driver arrived at dropoff location
          'delivered',         // Package successfully delivered
          'cancelled_sender',  // Cancelled by sender
          'cancelled_driver',  // Cancelled by driver (provide reason?)
          'cancelled_admin'    // Cancelled by admin
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
    // ------------------------------------
  });

  // Define DynamicPricing model
  const DynamicPricing = sequelize.define('DynamicPricing', {
    // These could be base rates, adjustments calculated in logic
    price_per_km: DataTypes.FLOAT,
    price_per_kg: DataTypes.FLOAT,
    price_per_size_unit: DataTypes.FLOAT, // Define 'size_unit' (e.g., cubic meter)
    price_per_quantity: DataTypes.FLOAT, // If quantity affects price beyond weight/size
    // Consider adding region/zone FK if pricing varies geographically
    // Consider adding vehicle_type FK if pricing varies by vehicle
  });

  // Define Notification model
  const Notification = sequelize.define('Notification', {
    sender_id: { // Foreign key for the Sender receiving the notification
      type: DataTypes.INTEGER,
      allowNull: false, // A notification must have a recipient sender
    },
    driver_id: { // Foreign key for the Driver receiving the notification
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
    // Add constraint/validation: Either sender_id or driver_id must be non-null?
    // Can be handled at application level or potentially DB check constraint if needed
  });


  // --- Define Relationships ---

  // Sender <-> Driver (One-to-One)
  // A Sender can have one Driver profile associated with their account.
  Sender.hasOne(Driver, { foreignKey: 'sender_id', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
  Driver.belongsTo(Sender, { foreignKey: 'sender_id' });

  // Driver <-> AdminApproval (One-to-One)
  // A Driver has one AdminApproval status record.
  Driver.hasOne(AdminApproval, { foreignKey: 'driver_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  AdminApproval.belongsTo(Driver, { foreignKey: 'driver_id' });

  // Sender <-> DeliveryRequest (One-to-Many)
  // A Sender can create many DeliveryRequests.
  Sender.hasMany(DeliveryRequest, { foreignKey: 'sender_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  DeliveryRequest.belongsTo(Sender, { foreignKey: 'sender_id' });

  // Driver <-> DeliveryRequest (One-to-Many) - NEW/UPDATED
  // A Driver can be assigned to handle many DeliveryRequests (sequentially or concurrently).
  Driver.hasMany(DeliveryRequest, { foreignKey: 'assigned_driver_id', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
  DeliveryRequest.belongsTo(Driver, { foreignKey: 'assigned_driver_id' });

  // Sender <-> Notification (One-to-Many)
  // A Sender can receive many Notifications.
  Sender.hasMany(Notification, { foreignKey: 'sender_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Notification.belongsTo(Sender, { foreignKey: 'sender_id' });

  // Driver <-> Notification (One-to-Many) - NEW
  // A Driver can receive many Notifications.
  Driver.hasMany(Notification, { foreignKey: 'driver_id', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
  Notification.belongsTo(Driver, { foreignKey: 'driver_id' });

  // Optional: Vehicle Relationships (Example: If a Driver MUST have a Vehicle)
  // Vehicle.belongsTo(Driver, { foreignKey: 'driverId' }); // Add driverId to Vehicle model
  // Driver.hasOne(Vehicle, { foreignKey: 'driverId' }); // Or hasMany if driver can have multiple vehicles


  // --- Return all models ---
  return {
    Sender,
    Vehicle,
    Driver,
    AdminApproval,
    DeliveryRequest,
    DynamicPricing,
    Notification,
  };
};
