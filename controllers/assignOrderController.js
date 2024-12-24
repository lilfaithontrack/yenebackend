import sendOrderNotification from '../utlis/sendOrderNotification.js';
import AssignOrder from '../models/AssignOrder.js';
import DeliveryBoy from '../models/DeliveryBoy.js';
import Shopper from '../models/Shopper.js';
import Payment from '../models/Payment.js';

// Function to assign a payment (as an order) to a shopper and delivery boy
export const assignPaymentToShopperAndDelivery = async (req, res) => {
  const { payment_id } = req.params; // The payment ID (used as the order ID) from the URL
  const { shopper_id, delivery_boy_id } = req.body; // Updated to match association foreign key

  try {
    // Fetch the payment record to verify its existence
    const payment = await Payment.findByPk(payment_id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Parse the cart_items from the payment record
    const orderDetails = JSON.parse(payment.cart_items);

    // Check if shopper and delivery boy exist
    const shopper = await Shopper.findByPk(shopper_id);
    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found' });
    }

    const deliveryBoy = await DeliveryBoy.findByPk(delivery_boy_id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    // Create the assignment record
    const assignment = await AssignOrder.create({
      order_id: payment_id, // Using payment_id as the order ID
      shopper_id,
      delivery_boy_id, // Updated to match association foreign key
    });

    // Send notifications to the shopper and delivery boy
    await sendOrderNotification(shopper, deliveryBoy, {
      id: payment_id,
      orderDetails,
      total_price: payment.total_price,
      shipping_address: payment.shipping_address,
      customer_name: payment.customer_name,
      customer_email: payment.customer_email,
      customer_phone: payment.customer_phone,
    });

    // Respond with the assignment data
    res.status(200).json({
      message: 'Order assigned successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error assigning payment:', error);
    res.status(500).json({ message: 'Error assigning payment', error });
  }
};

// Function to get all assignments, filtered by shopper_id or delivery_boy_id
export const getAssignments = async (req, res) => {
  const { shopper_id, delivery_boy_id } = req.query; // Updated query parameter names

  // Build the query filter based on the provided query parameters
  const whereClause = {};
  if (shopper_id) whereClause.shopper_id = shopper_id;
  if (delivery_boy_id) whereClause.delivery_boy_id = delivery_boy_id;

  try {
    // Get the assignments based on filters
    const assignments = await AssignOrder.findAll({
      where: whereClause,
      include: [
        {
          model: Shopper,
          as: 'shopper', // Matches the alias in AssignOrder.belongsTo(Shopper)
          attributes: ['id', 'full_name', 'email'],
        },
        {
          model: DeliveryBoy,
          as: 'deliveryBoy', // Matches the alias in AssignOrder.belongsTo(DeliveryBoy)
          attributes: ['id', 'full_name', 'email'],
        },
      ],
    });

    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No assignments found for the provided criteria' });
    }

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error });
  }
};

// Function to update the assignment status (e.g., mark as 'In Progress' or 'Completed')
export const updateAssignmentStatus = async (req, res) => {
  const { assignment_id } = req.params;
  const { status } = req.body; // The new status to be updated

  try {
    // Find the assignment to update
    const assignment = await AssignOrder.findByPk(assignment_id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update the assignment status
    assignment.status = status;
    await assignment.save();

    res.status(200).json({
      message: 'Assignment status updated successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ message: 'Error updating assignment status', error });
  }
};
