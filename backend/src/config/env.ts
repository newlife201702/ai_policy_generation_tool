import * as dotenv from 'dotenv';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('env');

// 加载 .env 文件，使用绝对路径
const result = dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

if (result.error) {
  logger.warn('无法加载 .env 文件:', result.error);
}

// 打印已加载的环境变量（不包含敏感信息）
logger.info('已加载环境变量:');
logger.info(`NODE_ENV: ${process.env.NODE_ENV}`);
logger.info(`PORT: ${process.env.PORT}`);
logger.info(`MONGODB_URI: ${process.env.MONGODB_URI ? '已设置' : '未设置'}`);
logger.info(`JWT_SECRET: ${process.env.JWT_SECRET ? '已设置' : '未设置'}`);
logger.info(`ALIYUN_SMS_ACCESS_KEY_ID: ${process.env.ALIYUN_SMS_ACCESS_KEY_ID ? '已设置' : '未设置'}`);
logger.info(`ALIYUN_SMS_ACCESS_KEY_SECRET: ${process.env.ALIYUN_SMS_ACCESS_KEY_SECRET ? '已设置' : '未设置'}`);
logger.info(`DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置'}`);
logger.info(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '已设置' : '未设置'}`);

// 检查必要的环境变量
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  logger.error(`缺少必要的环境变量: ${missingEnvVars.join(', ')}`);
  
  // 如果缺少 JWT_SECRET，使用随机生成的值
  if (missingEnvVars.includes('JWT_SECRET')) {
    const randomSecret = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
    process.env.JWT_SECRET = randomSecret;
    logger.warn(`未设置 JWT_SECRET，使用临时随机值: ${randomSecret.substring(0, 5)}...`);
  }
}

// 导出环境变量
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-policy-gen',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  // AI模型配置
  models: {
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
      model: process.env.OPENAI_MODEL || 'gpt-4',
    }
  },
  // SMS相关配置
  sms: {
    accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.ALIYUN_SMS_SIGN_NAME || '',
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || '',
  },
  // Email相关配置
  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    fromName: process.env.EMAIL_FROM_NAME || 'AI策略生成工具',
  },
};

logger.info('环境配置加载完成'); 