import { Order } from '../models/Order.js';

export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress, razorpayPaymentId } = req.body;
    const generatedOrderId = "ORD_RAZOR_" + Math.floor(100000 + Math.random() * 900000);

    const order = new Order({
      user: req.user?._id,
      orderId: generatedOrderId,
      items,
      totalAmount,
      shippingAddress,
      razorpayPaymentId: razorpayPaymentId || 'PAY_MOCK_' + Date.now(),
      paymentStatus: 'Paid',
      orderStatus: 'In Transit'
    });

    await order.save();
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus }, { new: true });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
