import AssignOrder from '../models/AssignOrder.js';
import Shopper from '../models/Shopper.js';
import DeliveryBoy from '../models/DeliveryBoy.js';
import Payment from '../models/Payment.js';

// Get all assigned orders
export const getAllAssignedOrders = async (req, res) => {
  try {
    const assignedOrders = await AssignOrder.findAll({
      include: [
        { model: Shopper, as: 'shopper', attributes: ['id', 'full_name'] },
        { model: DeliveryBoy, as: 'deliveryBoy', attributes: ['id', 'full_name'] },
        { model: Payment, attributes: ['id', 'payment_status', 'total_price'] },
      ],
    });

    res.status(200).json({
      success: true,
      data: assignedOrders,
    });
  } catch (error) {
    console.error('Error fetching assigned orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned orders.',
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
