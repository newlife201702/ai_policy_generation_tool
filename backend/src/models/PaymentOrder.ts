import mongoose from 'mongoose';

const paymentOrderSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  qrCodeUrl: {
    type: String,
    required: true
  },
  alipayTradeNo: {
    type: String,
    sparse: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建索引
paymentOrderSchema.index({ userId: 1, createdAt: -1 });
paymentOrderSchema.index({ alipayTradeNo: 1 }, { sparse: true });

export const PaymentOrder = mongoose.model('PaymentOrder', paymentOrderSchema); 