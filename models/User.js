import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  address: { type: String },
  phone: { type: String },
  refreshTokens: [{ type: String }],
  blacklistedTokens: [{ type: String }]
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
