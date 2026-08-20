import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  section: { type: String, required: true }, // 'hero', 'formula_motion', 'standards', 'showcase'
  videoUrl: { type: String, required: true },
  posterUrl: { type: String },
  aspectRatio: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Video = mongoose.model('Video', videoSchema);
