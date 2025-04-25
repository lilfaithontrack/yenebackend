// models/Telalaki.js
export default (sequelize, DataTypes) => {
  // User Model (Basic User Registration)
  const User = sequelize.define('User', {
    full_name: DataTypes.STRING,
    phone: {
      type: DataTypes.STRING,
      unique: true,
    },
  });

  // Vehicle Model (Car registration details)
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

  // Driver Model (Driver-specific info)
  const Driver = sequelize.define('Driver', {
    user_id: DataTypes.INTEGER,
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

  // Admin Approval Model (Track the approval/rejection status)
  const AdminApproval = sequelize.define('AdminApproval', {
    driver_id: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    approved_at: DataTypes.DATE,
    rejected_reason: DataTypes.STRING,
  });

  // Delivery Request Model (Tracking deliveries)
  const DeliveryRequest = sequelize.define('DeliveryRequest', {
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

    // Payment Info Fields
    payment_method: {
      type: DataTypes.ENUM('screenshot', 'cash'),
      defaultValue: 'cash',
    },
    payment_proof_url: DataTypes.STRING,  // For uploaded payment screenshot
    receipt_link: DataTypes.STRING,       // Receipt link alternative
    is_payment_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approved_by: DataTypes.ENUM('admin', 'driver'),
  });

  // Dynamic Pricing Model (Price calculation logic)
  const DynamicPricing = sequelize.define('DynamicPricing', {
    price_per_km: DataTypes.FLOAT,
    price_per_kg: DataTypes.FLOAT,
    price_per_size_unit: DataTypes.FLOAT,
    price_per_quantity: DataTypes.FLOAT,
  });

  // Associations
  User.hasOne(Driver, { foreignKey: 'user_id' });
  Driver.belongsTo(User, { foreignKey: 'user_id' });

  Driver.hasOne(AdminApproval, { foreignKey: 'driver_id' });
  AdminApproval.belongsTo(Driver, { foreignKey: 'driver_id' });

  return {
    User,
    Vehicle,
    Driver,
    AdminApproval,
    DeliveryRequest,
    DynamicPricing,
  };
};
