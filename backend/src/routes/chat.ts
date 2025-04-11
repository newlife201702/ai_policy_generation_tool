import { Router } from 'express';
import { z } from 'zod';
import { Conversation, IMessage } from '../models/conversation';
import { AppError } from '../middleware/errorHandler';
import { auth } from '../middleware/auth';
import { createLogger } from '../utils/logger';
import { Types } from 'mongoose';
import { chatController } from '../controllers/chatController';

const router = Router();
const logger = createLogger('chat');

const messageSchema = z.object({
  content: z.string(),
  parentId: z.string().optional(),
});

// 获取对话列表
router.get('/', auth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      userId: req.user._id,
      type: 'text',
    }).sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// 获取聊天历史记录
router.get('/history', auth, chatController.getHistory);

// 创建新对话
router.post('/', auth, async (req, res, next) => {
  try {
    const conversation = new Conversation({
      userId: req.user._id,
      type: 'text',
      title: '新对话',
      model: req.body.model || 'deepseek',
      messages: [],
    });

    await conversation.save();
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// 发送消息
router.post('/:conversationId/messages', async (req, res, next) => {
  try {
    const { content, parentId } = messageSchema.parse(req.body);
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      throw new AppError(404, '对话不存在');
    }

    // 添加用户消息
    const userMessage: Partial<IMessage> = {
      content,
      role: 'user',
      parentId: parentId ? new Types.ObjectId(parentId) : undefined,
    };
    conversation.messages.push(userMessage as IMessage);

    // TODO: 调用AI服务生成回复
    const aiResponse: Partial<IMessage> = {
      content: '这是一个AI回复',
      role: 'assistant',
      parentId: userMessage._id,
    };
    conversation.messages.push(aiResponse as IMessage);

    await conversation.save();
    res.json(conversation.messages);
  } catch (error) {
    next(error);
  }
});

// 重新生成回复
router.post('/:conversationId/messages/:messageId/regenerate', async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      throw new AppError(404, '对话不存在');
    }

    const messageIndex = conversation.messages?.findIndex(
      (m) => m._id?.toString() === req.params.messageId
    );

    if (messageIndex === undefined || messageIndex === -1) {
      throw new AppError(404, '消息不存在');
    }

    // 移除该消息之后的所有消息
    if (conversation.messages) {
      conversation.messages = conversation.messages.slice(0, messageIndex + 1);
    }

    // TODO: 调用AI服务重新生成回复
    const aiResponse: Partial<IMessage> = {
      content: '这是一个重新生成的AI回复',
      role: 'assistant',
      parentId: conversation.messages?.[messageIndex]._id,
    };
    conversation.messages.push(aiResponse as IMessage);

    await conversation.save();
    res.json(aiResponse);
  } catch (error) {
    next(error);
  }
});

// 文字对话
router.post('/text', auth, chatController.textChat);

// 流式文字对话
router.post('/text/stream', auth, chatController.streamTextChat);

export default router; 