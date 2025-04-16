import mongoose from 'mongoose';

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    id: {
      type: String,
      default: undefined,
    },
    parentId: {
      type: String,
      default: undefined,
    },
  }],
  model: {
    type: String,
    enum: ['deepseek', 'gpt4'],
    default: 'deepseek',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

chatHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema); 