import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'MISFITS' },
  tagline: { type: String, default: 'Indian Ingredient Intelligence Meets Modern Science' },
  seoTitle: { type: String, default: 'MISFITS — Defy Limits' },
  seoDescription: { type: String },
  logoUrl: { type: String },
  contactEmail: { type: String, default: 'care@misfits.in' },
  contactPhone: { type: String, default: '+91 98765 43210' },
  socialLinks: {
    instagram: { type: String },
    twitter: { type: String },
    youtube: { type: String }
  }
}, { timestamps: true });

export const Settings = mongoose.model('Settings', settingsSchema);
