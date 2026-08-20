import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtitle: { type: String },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  images: [{ type: String }],
  video: { type: String },
  description: { type: String },
  ingredients: [{ type: String }],
  benefits: [{ type: String }],
  variants: [
    {
      size: { type: String },
      price: { type: Number }
    }
  ],
  sku: { type: String },
  stock: { type: Number, default: 500 },
  rating: { type: Number, default: 4.9 }
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
