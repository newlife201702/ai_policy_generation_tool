import nodemailer from 'nodemailer';
import { createLogger } from '../utils/logger';
import { env } from '../config/env';

const logger = createLogger('email');

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config = {
      host: env.email.host,
      port: env.email.port,
      secure: env.email.secure,
      auth: {
        user: env.email.user,
        pass: env.email.password,
      },
      tls: {
        rejectUnauthorized: false, // 忽略证书验证
      },
    };

    logger.info('邮件服务配置:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
    });

    this.transporter = nodemailer.createTransport(config);

    // 验证邮件服务配置
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('邮件服务配置验证失败:', error);
      } else {
        logger.info('邮件服务配置验证成功');
      }
    });
  }

  async sendVerificationCode(email: string, code: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${env.email.fromName}" <${env.email.user}>`,
        to: email,
        subject: '验证码',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1890ff;">AI策略生成工具</h2>
            <p>您好！</p>
            <p>您的验证码是：<strong style="color: #1890ff; font-size: 24px;">${code}</strong></p>
            <p>验证码有效期为5分钟，请尽快使用。</p>
            <p>如果这不是您的操作，请忽略此邮件。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">此邮件由系统自动发送，请勿回复。</p>
          </div>
        `,
      };

      logger.info('准备发送邮件:', {
        from: mailOptions.from,
        to: mailOptions.to,
      });

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('邮件发送成功:', {
        messageId: info.messageId,
        response: info.response,
      });
      return true;
    } catch (error: any) {
      logger.error('邮件发送失败:', {
        email,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }
}

export const emailService = new EmailService(); 