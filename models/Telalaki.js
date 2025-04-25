// models/index.js
import sequelize from '../db/dbConnect.js';
import { DataTypes } from 'sequelize';

export default (sequelize, DataTypes) => {
  // Define Sender model (previously User)
  const Sender = sequelize.define('Sender', {
    full_name: DataTypes.STRING,
    phone: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  const Vehicle = sequelize.define('Vehicle', {
    owner_full_name: DataTypes.STRING,
    region: DataTypes.STRING,
    zone: DataTypes.STRING,
    district: DataTypes.STRING,
    house_number: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    car_type: DataTypes.STRING,
    car_name: DataTypes.STRING,
    manufacture_year: DataTypes.STRING,
    cargo_capacity: DataTypes.STRING,
    license_plate: DataTypes.STRING,
    commercial_license: DataTypes.STRING,
    tin_number: DataTypes.STRING,
    car_license_photo: DataTypes.STRING,
    owner_id_photo: DataTypes.STRING,
    car_photo: DataTypes.STRING,
    owner_photo: DataTypes.STRING,
  });

  const Driver = sequelize.define('Driver', {
    sender_id: { // Foreign key for Sender
      type: DataTypes.INTEGER,
      // allowNull: true,
      // unique: true
    },
    full_name: DataTypes.STRING,
    region: DataTypes.STRING,
    zone: DataTypes.STRING,
    district: DataTypes.STRING,
    house_number: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    driver_license_photo: DataTypes.STRING,
    identification_photo: DataTypes.STRING,
    is_owner: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });

  const AdminApproval = sequelize.define('AdminApproval', {
    driver_id: DataTypes.INTEGER, // Foreign key for Driver
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    approved_at: DataTypes.DATE,
    rejected_reason: DataTypes.STRING,
  });

  const DeliveryRequest = sequelize.define('DeliveryRequest', {
    sender_id: { // Foreign key for Sender (the sender)
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pickup_lat: DataTypes.FLOAT,
    pickup_lng: DataTypes.FLOAT,
    dropoff_lat: DataTypes.FLOAT,
    dropoff_lng: DataTypes.FLOAT,
    status: {
      type: DataTypes.ENUM('pending', 'assigned', 'on_the_way', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    delivery_time: DataTypes.DATE,
    weight: DataTypes.FLOAT,
    size: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    price: DataTypes.FLOAT,
    payment_method: {
      type: DataTypes.ENUM('screenshot', 'cash'),
      defaultValue: 'cash',
    },
    payment_proof_url: DataTypes.STRING,
    receipt_link: DataTypes.STRING,
    is_payment_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approved_by: DataTypes.ENUM('admin', 'driver'),
    /*
    assigned_driver_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
    */
  });

  const DynamicPricing = sequelize.define('DynamicPricing', {
    price_per_km: DataTypes.FLOAT,
    price_per_kg: DataTypes.FLOAT,
    price_per_size_unit: DataTypes.FLOAT,
    price_per_quantity: DataTypes.FLOAT,
  });

  // --- Add Notification model ---
  const Notification = sequelize.define('Notification', {
    sender_id: { // Foreign key for the Sender receiving the notification
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    message: { // The notification content
      type: DataTypes.TEXT, // Use TEXT for potentially longer messages
      allowNull: false,
    },
    type: { // Optional: Categorize notifications
      type: DataTypes.STRING, // Or ENUM('delivery_update', 'payment', 'approval', 'general')
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
    // Optional: Link notification to a specific entity (e.g., a DeliveryRequest)
    related_entity_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    related_entity_type: { // e.g., 'DeliveryRequest', 'DriverApproval'
        type: DataTypes.STRING,
        allowNull: true,
    }
  });
  // ----------------------------

  // --- Define relationships ---

  // Sender <-> Driver (One-to-One, assuming one Driver profile per Sender)
  Sender.hasOne(Driver, { foreignKey: 'sender_id' });
  Driver.belongsTo(Sender, { foreignKey: 'sender_id' });

  // Driver <-> AdminApproval (One-to-One)
  Driver.hasOne(AdminApproval, { foreignKey: 'driver_id' });
  AdminApproval.belongsTo(Driver, { foreignKey: 'driver_id' });

  // Sender <-> DeliveryRequest (One-to-Many)
  Sender.hasMany(DeliveryRequest, { foreignKey: 'sender_id' });
  DeliveryRequest.belongsTo(Sender, { foreignKey: 'sender_id' });

  // --- Add Sender <-> Notification relationship (One-to-Many) ---
  // A Sender can receive many Notifications
  Sender.hasMany(Notification, { foreignKey: 'sender_id' });
  // A Notification belongs to one Sender
  Notification.belongsTo(Sender, { foreignKey: 'sender_id' });
  // ----------------------------------------------------------

  // Optional: Driver <-> DeliveryRequest (One-to-Many)
  /*
  Driver.hasMany(DeliveryRequest, { foreignKey: 'assigned_driver_id' });
  DeliveryRequest.belongsTo(Driver, { foreignKey: 'assigned_driver_id' });
  */

  // --- Return all models, including Notification ---
  return {
    Sender,
    Vehicle,
    Driver,
    AdminApproval,
    DeliveryRequest,
    DynamicPricing,
    Notification, // <-- Added Notification
  };
  // -------------------------------------------------
};
