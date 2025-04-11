import { createLogger } from '../utils/logger';
import { env } from './env';

const logger = createLogger('sms');

export const SMS_CONFIG = {
  accessKeyId: env.sms.accessKeyId,
  secretAccessKey: env.sms.accessKeySecret,
  endpoint: 'https://dysmsapi.aliyuncs.com',
  apiVersion: '2017-05-25',
  signName: env.sms.signName,
  templateCode: env.sms.templateCode,
};

// 检查环境变量
const checkEnvVars = () => {
  const missingVars = [];
  if (!SMS_CONFIG.accessKeyId) missingVars.push('ALIYUN_SMS_ACCESS_KEY_ID');
  if (!SMS_CONFIG.secretAccessKey) missingVars.push('ALIYUN_SMS_ACCESS_KEY_SECRET');
  if (!SMS_CONFIG.signName) missingVars.push('ALIYUN_SMS_SIGN_NAME');
  if (!SMS_CONFIG.templateCode) missingVars.push('ALIYUN_SMS_TEMPLATE_CODE');

  if (missingVars.length > 0) {
    const warning = `阿里云短信配置缺失: ${missingVars.join(', ')}，短信功能可能无法正常工作`;
    logger.warn(warning);
  } else {
    logger.info('阿里云短信配置已加载完成');
  }
};

// 启动时检查环境变量，但不抛出错误
checkEnvVars(); 