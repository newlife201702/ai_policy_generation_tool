import { Types } from 'mongoose';
import { Conversation, IConversation } from '../models/conversation';
import { AppError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';
import { downloadAndSaveImage } from '../utils/imageUtils';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const logger = createLogger('imageGenService');

// 创建一个 axios 实例
const axiosInstance = axios.create({
  timeout: 600000, // 10分钟超时
});

// 图片保存目录配置
const IMAGES_DIR = 'uploads/images';

export interface GenerateImageParams {
  prompt: string;
  type: 'text2img' | 'img2img';
  sourceImage?: string;
}

export class ImageGenService {
  private static instance: ImageGenService;
  private readonly apiEndpoint: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  private constructor() {
    // this.apiEndpoint = 'https://api.siliconflow.cn';
    // this.apiKey = 'sk-fkcwndlwyfywjxmiumiyvyvnmtzcblllkcnisrfvufawdtep';
    this.apiEndpoint = 'https://api.xi-ai.cn';
    this.apiKey = 'sk-PNSSUJbbrwZ4ZCpo90CfBdC05e834c70AcF10185007b6461';
    // 设置基础URL，用于生成图片访问地址
    this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    if (!this.apiEndpoint || !this.apiKey) {
      throw new Error('Missing required environment variables for image generation');
    }
  }

  public static getInstance(): ImageGenService {
    if (!ImageGenService.instance) {
      ImageGenService.instance = new ImageGenService();
    }
    return ImageGenService.instance;
  }

  async getImageConversations(userId: Types.ObjectId): Promise<IConversation[]> {
    return await Conversation.find({
      userId,
      // type: 'image',
    }).sort({ updatedAt: -1 });
  }

  async createImageConversation(userId: Types.ObjectId): Promise<IConversation> {
    const conversation = new Conversation({
      userId,
      // type: 'image',
      title: '新图片对话',
      model: 'GPT-4o',
      images: [],
    });

    return await conversation.save();
  }

  async generateImage(
    conversationId: string,
    userId: Types.ObjectId,
    params: GenerateImageParams
  ) {
    console.log('conversationId', conversationId, 'userId', userId, 'params', params);
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
      // type: 'image',
    });

    if (!conversation) {
      throw new AppError(404, '对话不存在');
    }

    if (params.type === 'img2img' && !params.sourceImage) {
      throw new AppError(400, '图生图模式需要提供参考图片');
    }

    try {
      let imageBase64: string | undefined = undefined;
      let sourceImageUrl: string | undefined = undefined;
      if (params.type === 'img2img' && params.sourceImage) {
        // 读取本地图片文件为base64
        const absPath = path.isAbsolute(params.sourceImage)
          ? params.sourceImage
          : path.join(process.cwd(), params.sourceImage);
        const imageBuffer = fs.readFileSync(absPath);
        imageBase64 = 'data:image/png;base64,' + imageBuffer.toString('base64');
        // 生成原始图片的永久URL
        sourceImageUrl = `${this.baseUrl}/${params.sourceImage.replace(/\\/g, '/')}`;
      }

      // 调用AI服务生成图片
      // const response = await axios.post(
      //   `${this.apiEndpoint}/v1/images/generations`,
      //   {
      //     model: 'Kwai-Kolors/Kolors',
      //     prompt: params.prompt,
      //     image_size: '1024x1024',
      //     batch_size: 1,
      //     num_inference_steps: 20,
      //     guidance_scale: 7.5,
      //     // 添加图生图相关参数
      //     ...(params.type === 'img2img' && imageBase64 && {
      //       image: imageBase64
      //     })
      //   },
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${this.apiKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );
      const response = await axiosInstance.post(
        `${this.apiEndpoint}/v1/chat/completions`,
        {
          model: 'gpt-image-1-vip',
          // messages: [
          //   {
          //     role: 'user',
          //     content: params.prompt
          //   }
          // ],
          messages: conversation?.images?.map(item => ({
            role: 'user',
            content: item.prompt
          })).concat({
            role: 'user',
            content: params.prompt
          }),
          frequency_penalty: 0,
          max_tokens: 4000,
          presence_penalty: 0,
          stream: true,
          temperature: 0.5,
          top_p: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream'
        }
      );

      // 处理流式响应
      let imageUrl = '';
      let content = '';
      
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                content += parsed.choices[0].delta.content;
                
                // 从内容中提取图片URL
                const urlMatch = content.match(/https:\/\/filesystem\.site\/cdn\/[^)]+\.png/);
                if (urlMatch) {
                  imageUrl = urlMatch[0];
                  break;
                }
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
        
        if (imageUrl) {
          break;
        }
      }

      if (!imageUrl) {
        throw new AppError(500, '未能获取到生成的图片URL');
      }

      // 下载并保存图片
      // const aiGeneratedImageUrl = response.data.data[0].url;
      // const savedImagePath = await downloadAndSaveImage(aiGeneratedImageUrl, IMAGES_DIR);
      const savedImagePath = await downloadAndSaveImage(imageUrl, IMAGES_DIR);
      
      // 生成永久访问URL
      const permanentUrl = `${this.baseUrl}/${savedImagePath}`;

      const generatedImage = {
        prompt: params.prompt,
        url: permanentUrl, // 使用永久URL
        timestamp: new Date(),
        model: 'GPT-4o' as const,
        type: params.type,
        sourceImage: sourceImageUrl, // 存储为可访问的URL
      };

      conversation.images?.push(generatedImage);
      await conversation.save();

      return generatedImage;
    } catch (error) {
      console.error('Image generation failed:', error);
      logger.error('Image generation failed:', error);
      throw new AppError(500, '图片生成失败，请稍后重试');
    }
  }
} 