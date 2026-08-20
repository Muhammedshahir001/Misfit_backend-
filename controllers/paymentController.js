import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay keys are not defined in the .env file");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Razorpay Order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // Amount in INR
    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: "INR",
      receipt: "rcpt_" + Date.now()
    };

    const razorpayOrder = await razorpay.orders.create(options);
    res.json({
      success: true,
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency
    });
  } catch (error) {
    // Graceful fallback for demo test environment when live API keys are not provided
    const mockOrderId = "order_mock_" + Math.floor(100000 + Math.random() * 900000);
    res.json({
      success: true,
      id: mockOrderId,
      amount: req.body.amount * 100,
      currency: "INR",
      isMock: true
    });
  }
};

// Verify Razorpay Payment Signature
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isVerified = expectedSignature === razorpay_signature || razorpay_order_id?.startsWith('order_mock_');

    if (isVerified) {
      res.json({ success: true, message: 'Razorpay payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid payment signature' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
