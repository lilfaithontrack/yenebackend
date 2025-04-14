// models/
module.exports = (sequelize, DataTypes) => {
  const Telalaki = sequelize.define('Telalaki', {
    pickup_lat: DataTypes.FLOAT,
    pickup_lng: DataTypes.FLOAT,
    dropoff_lat: DataTypes.FLOAT,
    dropoff_lng: DataTypes.FLOAT,
    status: {
      type: DataTypes.ENUM('pending', 'on_the_way', 'completed'),
      defaultValue: 'pending',
    },
    delivery_time: DataTypes.DATE,
  });

  return Telalaki;
};
