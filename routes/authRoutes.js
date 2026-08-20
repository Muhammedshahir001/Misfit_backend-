import express from 'express';
import { signup, verifyOTP, resendOTP, login, logout, refreshToken, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { validateSignup, validateLogin, validateOTP, validateRefreshToken, validateForgotPassword, validateResetPassword } from '../middleware/validation.js';

const router = express.Router();

router.post('/signup', authLimiter, validateSignup, signup);
router.post('/verify-otp', otpLimiter, validateOTP, verifyOTP);
router.post('/resend-otp', otpLimiter, validateOTP, resendOTP);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh-token', authLimiter, validateRefreshToken, refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', authLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);

export default router;
