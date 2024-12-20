import { Shopper, DeliveryBoy } from '../models';  // Adjust model paths if needed

const sendOrderNotification = async (shopper, deliveryBoy, order) => {
  try {
    // Log the order assignment notification for debugging purposes
    console.log(`New Order Assignment: Sending notification to Shopper ${shopper.full_name} and Delivery Boy ${deliveryBoy.full_name}`);
    
    // Customize the message to reflect the order assignment
    const shopperMessage = `
      Hi ${shopper.full_name},\n\n
      A new order (ID: ${order.id}) has been assigned to you for processing.\n
      Please check your dashboard for further details.\n\n
      Thank you for your service!`;

    const deliveryBoyMessage = `
      Hi ${deliveryBoy.full_name},\n\n
      A new order (ID: ${order.id}) has been assigned to you for delivery.\n
      Please check your dashboard for delivery details.\n\n
      Thank you for your service!`;

    // Log the notification message
    console.log(`Shopper Message:\n${shopperMessage}`);
    console.log(`Delivery Boy Message:\n${deliveryBoyMessage}`);

    // Here, you'd send the email or push notification
    // Example: You can use an email service like Nodemailer or Firebase Cloud Messaging (FCM)

    // Example logging for the email content (as placeholders):
    console.log(`Sending email to Shopper: ${shopper.email}`);
    console.log(`Sending email to DeliveryBoy: ${deliveryBoy.email}`);
    
    // Assuming you will implement an actual email or push notification service later

  } catch (error) {
    console.error('Error sending order assignment notifications:', error);
    throw new Error('Error sending order assignment notifications');
  }
};

export default sendOrderNotification;
