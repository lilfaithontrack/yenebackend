import DeliveryBoy from '../models/DeliveryBoy.js'; 
import  Shopper from '../models/Shopper.js';/ Adjust model paths if needed

// Function to send notifications to both shopper and delivery boy
export const sendOrderNotification = async (shopper, deliveryBoy, order) => {
  try {
    // Notification message for the shopper
    const shopperMessage = `Dear ${shopper.full_name},\n\nYou have been assigned a new order.\nOrder ID: ${order.id}\nCustomer: ${order.customer_name}\nTotal Price: $${order.total_price.toFixed(
      2
    )}\n\nPlease prepare the order for delivery.\n\nThank you,\nYeneisuq Team`;

    // Notification message for the delivery boy
    const deliveryBoyMessage = `Dear ${deliveryBoy.full_name},\n\nYou have been assigned a new delivery.\nOrder ID: ${order.id}\nCustomer: ${order.customer_name}\nTotal Price: $${order.total_price.toFixed(
      2
    )}\n\nPlease coordinate with the shopper for order pickup.\n\nThank you,\nYeneisuq Team`;

    // Simulate sending the notification by logging the messages
    console.log("Shopper Notification:\n", shopperMessage);
    console.log("Delivery Boy Notification:\n", deliveryBoyMessage);

    console.log("Notifications generated successfully.");
  } catch (error) {
    console.error("Error generating notifications:", error);
    throw new Error("Failed to generate notifications");
  }
};
