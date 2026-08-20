import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: String, required: true },
  items: [
    {
      productName: { type: String },
      variantSize: { type: String },
      quantity: { type: Number },
      price: { type: Number }
    }
  ],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Paid' },
  razorpayPaymentId: { type: String },
  shippingAddress: { type: Object },
  orderStatus: { type: String, enum: ['Processing', 'In Transit', 'Delivered', 'Cancelled'], default: 'In Transit' }
}, { timestamps: true });

export const Order = mongoose.model('Order', orderSchema);
