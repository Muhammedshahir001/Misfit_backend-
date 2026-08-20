import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { sendOTP } from '../config/email.js';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the .env file");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is not defined in the .env file");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

const generateTokens = async (userId) => {
  const accessToken = jwt.sign(
    { id: userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { id: userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens.push(refreshToken);
    await user.save();
  }

  return { accessToken, refreshToken };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Signup & Send OTP
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (password.length > 128) {
      return res.status(400).json({ error: 'Password must be less than 128 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
      role: 'user'
    });

    await user.save();

    try {
      await sendOTP(email, otp);
      console.log(`[OTP] Sent to ${email}`);
    } catch (emailErr) {
      console.error('[OTP] Email send failed:', emailErr.message);
    }

    res.status(201).json({
      message: 'OTP sent to your email. Please verify to complete signup.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('[Signup Error]:', error.message);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified. Please login.' });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({ error: 'No OTP pending. Please signup again.' });
    }

    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP code' });

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const tokens = await generateTokens(user._id);

    res.json({
      message: 'Email verified successfully',
      isVerified: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      ...tokens,
    });
  } catch (error) {
    console.error('[VerifyOTP Error]:', error.message);
    res.status(500).json({ error: 'An error occurred during verification' });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isVerified) {
      return res.status(400).json({ error: 'Account is already verified. Please login.' });
    }

    if (user.otpExpiry && user.otpExpiry > new Date()) {
      const remainingSeconds = Math.ceil((user.otpExpiry - new Date()) / 1000);
      if (remainingSeconds > 240) {
        return res.status(429).json({ error: `Please wait ${Math.ceil(remainingSeconds / 60)} minutes before requesting a new OTP` });
      }
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    try {
      await sendOTP(email, otp);
      console.log(`[OTP] Resent to ${email}`);
    } catch (emailErr) {
      console.error('[OTP] Resend email failed:', emailErr.message);
    }

    res.json({ message: 'OTP resent to your email' });
  } catch (error) {
    console.error('[ResendOTP Error]:', error.message);
    res.status(500).json({ error: 'An error occurred while resending OTP' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Please verify your email first', needsVerification: true });
    }

    const tokens = await generateTokens(user._id);
    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, address: user.address, phone: user.phone },
      ...tokens
    });
  } catch (error) {
    console.error('[Login Error]:', error.message);
    res.status(500).json({ error: 'An error occurred during login' });
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token has expired. Please login again.' });
      }
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.blacklistedTokens.includes(token)) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
      await user.save();
      return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
    }

    if (!user.refreshTokens.includes(token)) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    const tokens = await generateTokens(user._id);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    console.error('[RefreshToken Error]:', error.message);
    res.status(500).json({ error: 'An error occurred while refreshing token' });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    const user = req.user;

    if (token) {
      user.blacklistedTokens.push(token);
      user.refreshTokens = user.refreshTokens.filter(t => t !== token);
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[Logout Error]:', error.message);
    res.status(500).json({ error: 'An error occurred during logout' });
  }
};

// Forgot Password Request
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(200).json({ message: 'If an account exists, a reset OTP has been sent.' });
    }

    if (user.otpExpiry && user.otpExpiry > new Date()) {
      const remainingSeconds = Math.ceil((user.otpExpiry - new Date()) / 1000);
      if (remainingSeconds > 240) {
        return res.status(429).json({ error: `Please wait ${Math.ceil(remainingSeconds / 60)} minutes before requesting a new OTP` });
      }
    }

    const resetOTP = generateOTP();
    user.otp = resetOTP;
    user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    try {
      await sendOTP(email, resetOTP);
    } catch (emailErr) {
      console.error('[OTP] Forgot password email failed:', emailErr.message);
    }

    res.json({ message: 'If an account exists, a reset OTP has been sent.' });
  } catch (error) {
    console.error('[ForgotPassword Error]:', error.message);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.otp !== otp) {
      return res.status(400).json({ error: 'Invalid reset request or OTP' });
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.refreshTokens = [];
    user.blacklistedTokens = [];
    await user.save();

    res.json({ message: 'Password reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('[ResetPassword Error]:', error.message);
    res.status(500).json({ error: 'An error occurred while resetting password' });
  }
};
