import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  avatar: { type: String },
  rating: { type: Number, default: 5 },
  quote: { type: String, required: true },
  tag: { type: String },
  rotation: { type: String, default: '-2deg' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);
