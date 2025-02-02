import AssignOrder from '../models/AssignOrder.js';
import Shopper from '../models/Shopper.js';
import DeliveryBoy from '../models/DeliveryBoy.js';
import Payment from '../models/Payment.js';

// Get all assigned orders
export const getAllAssignedOrders = async (req, res) => {
  try {
    console.log('📢 Fetching all assigned orders...');

    const assignedOrders = await AssignOrder.findAll({
      include: [
        {
          model: Shopper,
          as: 'shopper', // Ensure this matches the association in your models
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: DeliveryBoy,
          as: 'deliveryBoy', // Ensure this matches the association in your models
          attributes: ['id', 'full_name', 'email']
        },
        {
          model: Payment,
          as: 'payment', // Add the correct alias for Payment
          attributes: ['id', 'payment_status', 'total_price']
        }
      ]
    });

    console.log(`✅ Fetched ${assignedOrders.length} assigned orders.`);

    if (!assignedOrders || assignedOrders.length === 0) {
      console.warn('⚠️ No assigned orders found.');
      return res.status(404).json({
        success: false,
        message: 'No assigned orders found.',
        data: []
      });
    }

    // Format response
    const formattedOrders = assignedOrders.map(order => ({
      id: order.id,
      order_id: order.order_id || 'N/A',
      status: order.status || 'Pending',
      shopper: order.shopper ? {
        id: order.shopper.id,
        full_name: order.shopper.full_name,
        email: order.shopper.email
      } : null,
      deliveryBoy: order.deliveryBoy ? {
        id: order.deliveryBoy.id,
        full_name: order.deliveryBoy.full_name,
        email: order.deliveryBoy.email
      } : null,
      payment: order.payment ? { // Ensure alias matches Sequelize model association
        id: order.payment.id,
        payment_status: order.payment.payment_status,
        total_price: order.payment.total_price
      } : null
    }));

    return res.status(200).json({
      success: true,
      count: assignedOrders.length,
      data: formattedOrders
    });

  } catch (error) {
    console.error('❌ Error fetching assigned orders:', error);

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while fetching assigned orders.',
      error: error.message
    });
  }
};

// Get assigned orders for a specific shopper
export const getAssignedOrdersForShopper = async (req, res) => {
  const { shopper_id } = req.params;

  try {
    console.log(`📢 Fetching assigned orders for shopper with ID: ${shopper_id}`);

    const assignedOrders = await AssignOrder.findAll({
      where: { shopper_id },
      include: [
        { model: Payment, as: 'payment', attributes: ['id', 'payment_status', 'total_price'] }, // Use correct alias 'payment'
        { model: DeliveryBoy, as: 'deliveryBoy', attributes: ['id', 'full_name'] }, // Use correct alias 'deliveryBoy'
      ],
    });

    if (!assignedOrders.length) {
      console.warn('⚠️ No assigned orders found for this shopper.');
      return res.status(404).json({
        success: false,
        message: 'No assigned orders found for this shopper.',
      });
    }

    return res.status(200).json({
      success: true,
      count: assignedOrders.length,
      data: assignedOrders,
    });

  } catch (error) {
    console.error('❌ Error fetching orders for shopper:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders for the shopper.',
      error: error.message,
    });
  }
};

// Get assigned orders for a specific delivery boy

export const getAssignedOrdersForDeliveryBoy = async (req, res) => {
  const { delivery_id } = req.params;

  try {
    console.log(`📢 Fetching assigned orders for delivery boy with ID: ${delivery_id}`);

    const assignedOrders = await AssignOrder.findAll({
      where: { delivery_id },
      include: [
        {
          model: Payment,
          as: 'payment', // Ensure alias matches the association
          attributes: ['id', 'payment_status', 'total_price']
        },
        {
          model: Shopper,
          as: 'shopper',
          attributes: ['id', 'full_name', 'email']
        },
      ],
    });

    if (!assignedOrders.length) {
      console.warn('⚠️ No assigned orders found for this delivery boy.');
      return res.status(404).json({
        success: false,
        message: 'No assigned orders found for this delivery boy.',
      });
    }

    // Map the orders to the required format
    const formattedOrders = assignedOrders.map(order => ({
      id: order.id,
      order_id: order.order_id || 'N/A',
      status: order.status || 'Pending',
      shopper: order.shopper ? {
        id: order.shopper.id,
        full_name: order.shopper.full_name,
        email: order.shopper.email
      } : null,
      deliveryBoy: order.deliveryBoy ? {
        id: order.deliveryBoy.id,
        full_name: order.deliveryBoy.full_name,
        email: order.deliveryBoy.email
      } : null,
      payment: order.payment ? {
        id: order.payment.id,
        payment_status: order.payment.payment_status,
        total_price: order.payment.total_price
      } : null
    }));

    return res.status(200).json({
      success: true,
      count: assignedOrders.length,
      data: formattedOrders,
    });

  } catch (error) {
    console.error('❌ Error fetching orders for delivery boy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders for the delivery boy.',
      error: error.message,
    });
  }
};

// Assign a shopper and delivery boy to an order
export const assignOrder = async (req, res) => {
  const { payment_id, shopper_id, delivery_id } = req.body;

  // Validation
  if (!payment_id || !shopper_id || !delivery_id) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: payment_id, shopper_id, or delivery_id.',
    });
  }

  try {
    // Ensure the payment exists
    const payment = await Payment.findOne({ where: { id: payment_id } });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found.',
      });
    }

    // Create or update assignment
    const [assignOrder, created] = await AssignOrder.upsert({
      payment_id,
      shopper_id,
      delivery_id,
      status: 'Assigned',
      assigned_at: new Date(),
    });

    res.status(200).json({
      success: true,
      message: created
        ? 'Order assigned successfully.'
        : 'Order assignment updated successfully.',
      data: assignOrder,
    });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign order.',
    });
  }
};

// Get a single assigned order by payment_id
export const getAssignedOrderByPaymentId = async (req, res) => {
  const { payment_id } = req.params;

  try {
    const assignedOrder = await AssignOrder.findOne({
      where: { payment_id },
      include: [
        { model: Shopper, as: 'shopper', attributes: ['id', 'full_name'] },
        { model: DeliveryBoy, as: 'deliveryBoy', attributes: ['id', 'full_name'] },
        { model: Payment, attributes: ['id', 'payment_status', 'total_price'] },
      ],
    });

    if (!assignedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Assigned order not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: assignedOrder,
    });
  } catch (error) {
    console.error('Error fetching assigned order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned order.',
    });
  }
};

// Delete an assignment by payment_id
export const deleteAssignedOrder = async (req, res) => {
  const { payment_id } = req.params;

  try {
    const deleted = await AssignOrder.destroy({ where: { payment_id } });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Assigned order not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assigned order deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting assigned order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assigned order.',
    });
  }
};
