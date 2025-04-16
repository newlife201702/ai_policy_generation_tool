import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';
import { auth } from '../middleware/auth';
import { Message } from '../types/chat';
import { modelService } from '../services/modelService';
import { ChatHistory } from '../models/chatHistory';
import { env } from '../config/env';

const logger = createLogger('chat');

export const chatController = {
  async textChat(req: Request, res: Response) {
    logger.info('收到文本聊天请求');
    
    try {
      logger.info('当前认证用户:', req.user ? req.user._id : '未认证');
      
      // 检查认证信息
      if (!req.user) {
        logger.warn('用户未认证，返回401错误');
        return res.status(401).json({ message: '未授权，请先登录' });
      }
      
      const { messages, model = 'deepseek' } = req.body as { messages: Message[]; model: string };
      const userId = req.user._id;

      logger.info(`用户 ${userId} 请求与模型 ${model} 聊天`);
      logger.info(`消息数量: ${messages?.length || 0}`);
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        logger.warn('消息为空，返回400错误');
        return res.status(400).json({ message: '消息不能为空' });
      }

      // 根据配置选择模型
      const selectedModel = model === 'deepseek' ? modelService.deepseek : modelService.gpt4;
      logger.info(`选择模型: ${model}`);
      
      // 检查选定模型的 API 密钥是否已配置
      const modelConfig = model === 'deepseek' ? env.models.deepseek : env.models.openai;
      if (!modelConfig.apiKey) {
        logger.warn(`模型 ${model} 的 API 密钥未配置，返回模拟响应`);
        // 返回模拟响应而不是错误，这样用户仍然可以测试功能
        const lastMessage = messages[messages.length - 1];
        const simulatedResponse = {
          content: `这是一个模拟响应。管理员需要配置 ${model} 的 API 密钥才能获得真实响应。您的消息是：${lastMessage.content}`,
          timestamp: new Date().toISOString()
        };
        
        // 保存消息历史记录
        logger.info('保存消息历史记录（模拟响应）');
        const chatHistory = new ChatHistory({
          userId,
          messages: [...messages, {
            role: 'assistant',
            content: simulatedResponse.content,
            timestamp: new Date(),
          }],
          model,
        });
        await chatHistory.save();
        
        return res.json(simulatedResponse);
      }

      // 调用模型 API
      logger.info('调用模型 API');
      const response = await selectedModel.chat(messages);
      logger.info('模型 API 调用成功');

      // 保存消息历史记录
      logger.info('保存消息历史记录');
      const chatHistory = new ChatHistory({
        userId,
        messages: [...messages, {
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        }],
        model,
      });
      await chatHistory.save();
      logger.info('消息历史记录保存成功');

      logger.info('返回成功响应');
      res.json(response);
    } catch (error: any) {
      const errorMessage = error.message || '未知错误';
      logger.error('文字对话失败:', errorMessage);
      
      // 返回友好的错误消息
      res.status(500).json({ 
        message: '文字对话失败', 
        error: errorMessage,
        tip: '请检查AI模型的API配置是否正确，或稍后再试。'
      });
    }
  },

  async streamTextChat(req: Request, res: Response) {
    logger.info('收到流式文本聊天请求');
    
    try {
      logger.info('当前认证用户:', req.user ? req.user._id : '未认证');
      
      // 检查认证信息
      if (!req.user) {
        logger.warn('用户未认证，返回401错误');
        return res.status(401).json({ message: '未授权，请先登录' });
      }
      
      const { messages, model = 'deepseek', id, parentId } = req.body as { messages: Message[]; model: string; id: string; parentId: string };
      const userId = req.user._id;

      logger.info(`用户 ${userId} 请求与模型 ${model} 流式聊天`);
      logger.info(`消息数量: ${messages?.length || 0}`);
      
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        logger.warn('消息为空，返回400错误');
        return res.status(400).json({ message: '消息不能为空' });
      }

      // 根据配置选择模型
      const selectedModel = model === 'deepseek' ? modelService.deepseek : modelService.gpt4;
      logger.info(`选择模型: ${model}`);
      
      // 创建一个变量来存储完整的响应内容
      let fullContent = '';
      
      // 拦截流式响应中的内容
      const originalWrite = res.write;
      res.write = function(chunk: any) {
        try {
          const data = chunk.toString();
          if (data.startsWith('data:')) {
            const jsonStr = data.substring(5).trim();
            try {
              const json = JSON.parse(jsonStr);
              if (json.content) {
                fullContent += json.content;
                logger.debug(`累积内容长度: ${fullContent.length}`);
              } else if (json.fullContent) {
                fullContent = json.fullContent;
                logger.debug(`使用完整内容替换, 长度: ${fullContent.length}`);
              }
            } catch (e) {
              logger.warn('解析响应JSON失败:', e);
            }
          }
        } catch (error) {
          logger.error('拦截响应内容失败:', error);
        }
        return originalWrite.apply(res, arguments as any);
      };
      
      // 设置响应结束的事件处理函数，用于保存聊天历史
      res.on('close', async () => {
        try {
          if (fullContent) {
            logger.info(`流式响应结束，保存消息历史记录，内容长度: ${fullContent.length}`);
            const chatHistory = new ChatHistory({
              userId,
              messages: [...messages, {
                id,
                role: 'assistant',
                content: fullContent,
                timestamp: new Date(),
                parentId
              }],
              model,
            });
            await chatHistory.save();
            logger.info('消息历史记录保存成功');
          } else {
            logger.warn('流式响应结束，但没有内容可保存');
          }
        } catch (error) {
          logger.error('保存聊天历史记录失败:', error);
        }
      });

      // 监听流式消息的完成事件
      req.on('end', () => {
        logger.info('客户端流式请求结束');
      });

      // 调用模型 API 进行流式响应
      logger.info('调用模型流式 API');
      await selectedModel.streamChat(messages, res);
      
      // 注意：不需要在这里结束响应，因为 streamChat 方法会处理响应结束
      
    } catch (error: any) {
      const errorMessage = error.message || '未知错误';
      logger.error('流式文字对话失败:', errorMessage);
      
      // 尝试发送错误响应
      try {
        if (!res.headersSent) {
          // 如果响应头尚未发送，则以 JSON 形式发送错误
          res.status(500).json({ 
            message: '流式文字对话失败', 
            error: errorMessage,
            tip: '请检查AI模型的API配置是否正确，或稍后再试。'
          });
        } else {
          // 如果响应头已发送，则发送 SSE 格式的错误消息
          res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
          res.end();
        }
      } catch (sendError) {
        logger.error('发送错误响应失败:', sendError);
        try {
          res.end();
        } catch (_) {
          // 忽略结束响应的错误
        }
      }
    }
  },

  async getHistory(req: Request, res: Response) {
    logger.info('收到获取聊天历史记录请求');

    try {
      const userId = req.user._id;
      logger.info(`获取用户 ${userId} 的聊天历史`);

      const chatHistories = await ChatHistory.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(10);

      logger.info(`找到 ${chatHistories.length} 条历史记录`);
      res.json(chatHistories);
    } catch (error) {
      logger.error('获取历史记录失败:', error);
      res.status(500).json({ message: '获取历史记录失败' });
    }
  },
}; 