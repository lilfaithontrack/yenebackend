// utils/

import { Shopper, DeliveryBoy } from '../models';  // Adjust model paths if needed

const sendOrderNotification = async (shopper, deliveryBoy, order) => {
  try {
    // Example: Sending email notifications or any other notification mechanism
    console.log(`Sending order assignment notification to shopper ${shopper.full_name} and delivery boy ${deliveryBoy.full_name}`);
    
    // Here you could use an email service or push notifications
    // Example: emailService.send({
    //   to: shopper.email,
    //   subject: `New Order Assigned: ${order.id}`,
    //   text: `You have been assigned to process order ${order.id}`
    // });

    // Example: Similar notification to the delivery boy
    // Example: emailService.send({
    //   to: deliveryBoy.email,
    //   subject: `New Delivery Assigned: ${order.id}`,
    //   text: `You have been assigned to deliver order ${order.id}`
    // });
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw new Error('Error sending notifications');
  }
};

export default sendOrderNotification;
