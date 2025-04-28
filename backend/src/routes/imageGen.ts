import { Router } from 'express';
import { auth } from '../middleware/auth';
import { ImageGenController } from '../controllers/imageGenController';
import { upload } from '../middleware/upload';

const router = Router();
const imageGenController = ImageGenController.getInstance();

// 获取图片对话列表
router.get('/', auth, imageGenController.getImageConversations);

// 创建新图片对话
router.post('/', auth, imageGenController.createImageConversation);

// 生成图片
router.post(
  '/:conversationId/generate',
  auth,
  upload.single('sourceImage'),
  imageGenController.generateImage
);

export default router; 