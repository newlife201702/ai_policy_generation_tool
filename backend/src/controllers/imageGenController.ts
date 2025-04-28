import { Request, Response, NextFunction } from 'express';
import { ImageGenService } from '../services/imageGenService';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const generateImageSchema = z.object({
  prompt: z.string().min(1),
  type: z.enum(['text2img', 'img2img']),
});

export class ImageGenController {
  private static instance: ImageGenController;
  private readonly imageGenService: ImageGenService;

  private constructor() {
    this.imageGenService = ImageGenService.getInstance();
  }

  public static getInstance(): ImageGenController {
    if (!ImageGenController.instance) {
      ImageGenController.instance = new ImageGenController();
    }
    return ImageGenController.instance;
  }

  getImageConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const conversations = await this.imageGenService.getImageConversations(
        req.user._id
      );
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  };

  createImageConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const conversation = await this.imageGenService.createImageConversation(
        req.user._id
      );
      res.json(conversation);
    } catch (error) {
      next(error);
    }
  };

  generateImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log('req.body:', req.body);
      console.log('req.file:', req.file);

      const { prompt, type } = generateImageSchema.parse(req.body);
      
      // 如果类型是 img2img 但没有上传文件，抛出错误
      if (type === 'img2img' && !req.file) {
        throw new AppError(400, '图生图模式需要上传源图片');
      }

      const image = await this.imageGenService.generateImage(
        req.params.conversationId,
        req.user._id,
        {
          prompt,
          type,
          sourceImage: req.file ? req.file.path : undefined
        }
      );
      res.json(image);
    } catch (error) {
      next(error);
    }
  };
} 