import sendOrderNotification from '../utlis/sendOrderNotification.js';
import AssignOrder from '../models/AssignOrder.js';
import DeliveryBoy from '../models/DeliveryBoy.js';
import Shopper from '../models/Shopper.js';
import Payment from '../models/Payment.js';

// Reusable function to fetch assignments with details
export const getAssignmentsWithDetails = async (whereClause = {}) => {
  return await AssignOrder.findAll({
    where: whereClause,
    include: [
      {
        model: Shopper,
        as: 'shopper',
        attributes: ['id', 'full_name', 'email'],
      },
      {
        model: DeliveryBoy,
        as: 'deliveryBoy',
        attributes: ['id', 'full_name', 'email'],
      },
    ],
  });
};

// Assign payment to shopper and delivery boy
export const assignPaymentToShopperAndDelivery = async (req, res) => {
  const { payment_id } = req.params;
  const { shopper_id, delivery_id } = req.body;

  // Input validation
  if (!shopper_id || !delivery_id) {
    return res.status(400).json({ message: 'shopper_id and delivery_id are required' });
  }

  try {
    // Fetch payment details
    const payment = await Payment.findByPk(payment_id, {
      attributes: ['id', 'cart_items', 'total_price', 'shipping_address', 'customer_name', 'customer_email', 'customer_phone'],
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Validate shopper and delivery boy
    const shopper = await Shopper.findByPk(shopper_id);
    if (!shopper) {
      return res.status(404).json({ message: 'Shopper not found' });
    }

    const deliveryBoy = await DeliveryBoy.findByPk(delivery_id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    // Create assignment
    const assignment = await AssignOrder.create({
      order_id: payment_id,
      shopper_id,
      delivery_id,
    });

    // Send notification
    await sendOrderNotification(shopper, deliveryBoy, {
      id: payment_id,
      orderDetails: JSON.parse(payment.cart_items),
      total_price: payment.total_price,
      shipping_address: payment.shipping_address,
      customer_name: payment.customer_name,
      customer_email: payment.customer_email,
      customer_phone: payment.customer_phone,
    });

    // Success response
    res.status(200).json({
      message: 'Order assigned successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error assigning payment:', error);
    res.status(500).json({ message: 'Error assigning payment', error: error.message });
  }
};

// Get all assignments (filtered by shopper_id or delivery_id)
export const getAssignments = async (req, res) => {
  const { shopper_id, delivery_id } = req.query;
  const whereClause = {};

  // Build where clause dynamically
  if (shopper_id) whereClause.shopper_id = shopper_id;
  if (delivery_id) whereClause.delivery_id = delivery_id;

  try {
    const assignments = await getAssignmentsWithDetails(whereClause);
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No assignments found for the provided criteria' });
    }
    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

// Update assignment status
export const updateAssignmentStatus = async (req, res) => {
  const { assignment_id } = req.params;
  const { status } = req.body;

  // Validate status
  const allowedStatuses = ['Assigned', 'In Progress', 'Completed'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const assignment = await AssignOrder.findByPk(assignment_id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update status
    assignment.status = status;
    await assignment.save();

    res.status(200).json({
      message: 'Assignment status updated successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ message: 'Error updating assignment status', error: error.message });
  }
};

// Get all assigned orders
export const getAllAssignedOrders = async (req, res) => {
  try {
    const assignments = await getAssignmentsWithDetails();
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No assigned orders found' });
    }
    res.status(200).json({ message: 'Assigned orders retrieved successfully', assignments });
  } catch (error) {
    console.error('Error fetching all assigned orders:', error);
    res.status(500).json({ message: 'Error fetching all assigned orders', error: error.message });
  }
};

// Get orders for a specific shopper
export const getOrdersForShopper = async (req, res) => {
  const { shopper_id } = req.params;

  try {
    const assignments = await getAssignmentsWithDetails({ shopper_id });
    if (assignments.length === 0) {
      return res.status(404).json({ message: 'No orders found for this shopper' });
    }
    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Error fetching orders for shopper:', error);
    res.status(500).json({ message: 'Error fetching orders for shopper', error: error.message });
  }
};


// Get orders for a specific delivery boy
// Controller to fetch orders assigned to a delivery boy
export const getOrdersForDeliveryBoy = async (req, res) => {
  try {
    const { delivery_boy_id } = req.params; // Ensure this matches the param you pass in the URL
    if (!delivery_boy_id) {
      return res.status(400).json({ message: 'Delivery boy ID is required' });
    }

    // Use the correct model name (AssignOrder instead of Assignment)
    const assignments = await AssignOrder.findAll({
      where: { delivery_id: delivery_boy_id }, // Match the field in the AssignOrder model
      include: [
        {
          model: Payment,
          as: 'payment',  // Ensure this alias matches the alias defined in the AssignOrder model
          attributes: ['cart_items', 'total_price', 'shipping_address']
        },
        {
          model: Shopper,
          as: 'shopper',  // Ensure this alias matches the alias defined in the AssignOrder model
          attributes: ['full_name']
        }
      ]
    });

    if (!assignments.length) {
      return res.status(404).json({ message: 'No assignments found' });
    }

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
