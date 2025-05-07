import { createLogger } from '../utils/logger';
import { Message } from '../types/chat';
import axios from 'axios';
import { env } from '../config/env';
import { Response } from 'express';

const logger = createLogger('model');

// 修改接口定义，使用类型断言避免类型冲突
type StreamResponse = Response & {
  flush?: () => void;
  flushHeaders?: () => void;
};

interface ModelConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ModelResponse {
  content: string;
}

class ModelService {
  private config: ModelConfig;

  constructor(config: ModelConfig) {
    this.config = config;
    logger.info(`初始化模型服务: ${config.model}，API Key: ${config.apiKey ? '已设置' : '未设置'}`);
  }

  async chat(messages: Message[]): Promise<ModelResponse> {
    try {
      // 如果没有配置 API Key，返回一个模拟响应
      if (!this.config.apiKey) {
        logger.warn(`模型 ${this.config.model} 未配置 API Key，返回模拟响应`);
        return {
          content: `这是一个模拟响应。您需要配置 ${this.config.model} 的 API Key 才能获得真实响应。您的消息：${messages[messages.length - 1].content}`
        };
      }

      const apiUrl = `${this.config.baseUrl}/v1/chat/completions`;
      logger.info(`调用模型 API: ${apiUrl}, 模型: ${this.config.model}`);
      
      const response = await axios.post(
        apiUrl,
        {
          model: this.config.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('模型 API 调用成功');
      return {
        content: response.data.choices[0].message.content,
      };
    } catch (error: any) {
      logger.error('模型调用失败:', error.message || error);
      if (error.response) {
        logger.error('模型 API 错误响应:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      throw new Error('模型调用失败');
    }
  }

  async streamChat(messages: Message[], res: Response): Promise<void> {
    // 使用类型断言
    const streamRes = res as StreamResponse;
    
    try {
      // 如果没有配置 API Key，返回一个模拟响应
      if (!this.config.apiKey) {
        logger.warn(`模型 ${this.config.model} 未配置 API Key，返回模拟响应`);
        
        // 设置响应头
        streamRes.setHeader('Content-Type', 'text/event-stream');
        streamRes.setHeader('Cache-Control', 'no-cache');
        streamRes.setHeader('Connection', 'keep-alive');
        
        // 发送模拟的流式响应
        const simulatedContent = `这是一个模拟响应。您需要配置 ${this.config.model} 的 API Key 才能获得真实响应。您的消息：${messages[messages.length - 1].content}`;
        
        // 每100ms发送一部分内容，模拟流式效果
        const chunks = simulatedContent.split(' ');
        let index = 0;
        
        const interval = setInterval(() => {
          if (index < chunks.length) {
            const chunk = chunks[index];
            streamRes.write(`data: ${JSON.stringify({ content: chunk + ' ', done: false })}\n\n`);
            // Express响应对象可能没有flush方法
            if (streamRes.flush) {
              streamRes.flush();
            }
            index++;
          } else {
            streamRes.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
            // Express响应对象可能没有flush方法
            if (streamRes.flush) {
              streamRes.flush();
            }
            clearInterval(interval);
            streamRes.end();
          }
        }, 100);
        
        return;
      }

      // const apiUrl = this.config.baseUrl === 'https://ark.cn-beijing.volces.com/api/v3/bots' ? `${this.config.baseUrl}/chat/completions` : `${this.config.baseUrl}/v1/chat/completions`;
      const apiUrl = `${this.config.baseUrl}/v1/chat/completions`;
      logger.info(`调用模型流式 API: ${apiUrl}, 模型: ${this.config.model}`);
      
      // 设置响应头
      streamRes.setHeader('Content-Type', 'text/event-stream');
      streamRes.setHeader('Cache-Control', 'no-cache');
      streamRes.setHeader('Connection', 'keep-alive');
      
      // Express响应对象可能没有flushHeaders方法
      if (streamRes.flushHeaders) {
        streamRes.flushHeaders();
      }
      
      // 发送请求到模型 API，启用流式响应
      const response = await axios.post(
        apiUrl,
        {
          model: this.config.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true, // 启用流式响应
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        }
      );
      
      let fullContent = '';

      // 处理流式响应
      response.data.on('data', (chunk: Buffer) => {
        try {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            // 忽略空行和注释
            if (!line.trim() || line.startsWith(':')) continue;
            
            // 解析数据行
            const jsonStr = line.replace(/^data: /, '').trim();
            
            // 处理特殊的 [DONE] 标记
            if (jsonStr === '[DONE]') {
              // 流结束，发送完成标记
              streamRes.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
              // Express响应对象可能没有flush方法
              if (streamRes.flush) {
                streamRes.flush();
              }
              continue;
            }
            
            try {
              const json = JSON.parse(jsonStr);
              
              // 检查响应格式，提取内容
              if (json.choices && json.choices[0]) {
                const { delta } = json.choices[0];
                
                if (delta && delta.content) {
                  // 将内容片段发送给客户端
                  fullContent += delta.content;
                  streamRes.write(`data: ${JSON.stringify({ content: delta.content, done: false })}\n\n`);
                  // Express响应对象可能没有flush方法
                  if (streamRes.flush) {
                    streamRes.flush();
                  }
                  logger.debug(`发送内容片段: "${delta.content}"`);
                }
              }
            } catch (parseError) {
              logger.warn('解析 JSON 失败:', parseError);
              // 忽略解析错误，继续处理其他行
            }
          }
        } catch (error) {
          logger.error('处理流式响应出错:', error);
        }
      });

      response.data.on('end', () => {
        logger.info('流式响应结束，总内容长度:', fullContent.length);
        // 发送最终的完成标记
        streamRes.write(`data: ${JSON.stringify({ content: '', done: true, fullContent })}\n\n`);
        // Express响应对象可能没有flush方法
        if (streamRes.flush) {
          streamRes.flush();
        }
        streamRes.end();
      });

      response.data.on('error', (error: Error) => {
        logger.error('流式响应出错:', error);
        streamRes.write(`data: ${JSON.stringify({ error: '流式响应出错', done: true })}\n\n`);
        // Express响应对象可能没有flush方法
        if (streamRes.flush) {
          streamRes.flush();
        }
        streamRes.end();
      });
      
    } catch (error: any) {
      logger.error('模型流式调用失败:', error.message || error);
      if (error.response) {
        logger.error('模型流式 API 错误响应:', {
          status: error.response.status,
          data: error.response.data,
        });
      }
      
      // 向客户端发送错误信息
      streamRes.write(`data: ${JSON.stringify({ error: '模型调用失败', done: true })}\n\n`);
      // Express响应对象可能没有flush方法
      if (streamRes.flush) {
        streamRes.flush();
      }
      streamRes.end();
    }
  }
}

// 创建模型实例
const deepseek = new ModelService(env.models.deepseek);
const gpt4 = new ModelService(env.models.openai);

export const modelService = {
  deepseek,
  gpt4,
}; 