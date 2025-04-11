import { Router } from 'express';
import { z } from 'zod';
import { Conversation } from '../models/conversation';
import { AppError } from '../middleware/errorHandler';
import { auth } from '../middleware/auth';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('imageGen');

const generateImageSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(['text2img', 'img2img']),
  sourceImage: z.string().optional(),
});

// 获取图片对话列表
router.get('/', auth, async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      userId: req.user._id,
      type: 'image',
    }).sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

// 创建新图片对话
router.post('/', auth, async (req, res, next) => {
  try {
    const conversation = new Conversation({
      userId: req.user._id,
      type: 'image',
      title: '新图片对话',
      model: 'GPT-4o',
      images: [],
    });

    await conversation.save();
    res.json(conversation);
  } catch (error) {
    next(error);
  }
});

// 生成图片
router.post('/:conversationId/generate', auth, async (req, res, next) => {
  try {
    const { prompt, type, sourceImage } = generateImageSchema.parse(req.body);
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      userId: req.user._id,
      type: 'image',
    });

    if (!conversation) {
      throw new AppError(404, '对话不存在');
    }

    if (type === 'img2img' && !sourceImage) {
      throw new AppError(400, '图生图模式需要提供参考图片');
    }

    // TODO: 调用AI服务生成图片
    const image = {
      prompt,
      url: 'https://via.placeholder.com/512',
      timestamp: new Date(),
      model: 'GPT-4o' as const,
      type,
      sourceImage,
    };

    conversation.images?.push(image);
    await conversation.save();

    res.json(image);
  } catch (error) {
    next(error);
  }
});

export default router; 