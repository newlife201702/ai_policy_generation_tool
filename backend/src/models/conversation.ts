import { Schema, model, Document, Types, Model } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  parentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface IImage {
  prompt: string;
  url: string;
  timestamp: Date;
  model: 'GPT-4o';
  type: 'text2img' | 'img2img';
  sourceImage?: string;
}

export interface IConversation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  model: 'deepseek' | 'GPT-4o';
  messages: IMessage[];
  images?: IImage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

const imageSchema = new Schema<IImage>({
  prompt: { type: String, required: true },
  url: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  model: { type: String, enum: ['GPT-4o'], required: true },
  type: { type: String, enum: ['text2img', 'img2img'], required: true },
  sourceImage: String,
});

const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      enum: ['deepseek', 'GPT-4o'],
      required: true,
    },
    messages: [messageSchema],
    images: [imageSchema],
  },
  {
    timestamps: true,
  }
);

export const Conversation = model<IConversation>('Conversation', conversationSchema); 