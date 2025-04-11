import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email?: string;
  phone?: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: '邮箱格式不正确',
      },
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^1\d{10}$/.test(v);
        },
        message: '手机号格式不正确',
      },
    },
    verificationCode: String,
    verificationCodeExpires: Date,
  },
  {
    timestamps: true,
  }
);

// 确保用户至少有一个联系方式
userSchema.pre('save', function (next) {
  if (!this.email && !this.phone) {
    next(new Error('用户必须提供邮箱或手机号'));
  } else {
    next();
  }
});

export const User = model<IUser>('User', userSchema); 