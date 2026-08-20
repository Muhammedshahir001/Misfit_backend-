import { Coupon } from '../models/Coupon.js';

export const createCoupon = async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon code' });
    if (new Date() > new Date(coupon.expiryDate)) return res.status(400).json({ error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached' });
    if (cartTotal < coupon.minPurchase) return res.status(400).json({ error: `Minimum purchase of ₹${coupon.minPurchase} required` });

    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
