import express from 'express';
import { createCoupon, validateCoupon, getCoupons } from '../controllers/couponController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, adminOnly, createCoupon);
router.post('/validate', protect, validateCoupon);
router.get('/', protect, adminOnly, getCoupons);

export default router;
