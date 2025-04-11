// @ts-ignore
import SMSClient from '@alicloud/sms-sdk';
import { SMS_CONFIG } from '../config/sms';
import { createLogger } from '../utils/logger';

const logger = createLogger('sms');

interface SMSClientConfig {
  accessKeyId: string;
  secretAccessKey: string;
}

interface SendSMSOptions {
  PhoneNumbers: string;
  SignName: string;
  TemplateCode: string;
  TemplateParam: string;
}

interface SMSResponse {
  Code: string;
  Message: string;
  RequestId: string;
  BizId: string;
}

class SMSService {
  private client: any;

  constructor() {
    this.client = new SMSClient({
      accessKeyId: SMS_CONFIG.accessKeyId,
      secretAccessKey: SMS_CONFIG.secretAccessKey,
    });
  }

  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    try {
      const response = await this.client.sendSMS({
        PhoneNumbers: phone,
        SignName: SMS_CONFIG.signName,
        TemplateCode: SMS_CONFIG.templateCode,
        TemplateParam: JSON.stringify({ code }),
      });

      if (response.Code === 'OK') {
        logger.info(`验证码发送成功: ${phone}, 验证码: ${code}`);
        return true;
      } else {
        logger.error(`验证码发送失败: ${phone}, ${response.Message}`);
        return false;
      }
    } catch (error: any) {
      logger.error(`验证码发送异常: ${phone}, ${error.message}`);
      return false;
    }
  }
}

export const smsService = new SMSService(); 