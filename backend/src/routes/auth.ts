import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/user';
import { AppError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';
import { smsService } from '../services/sms';
import { emailService } from '../services/email';
import { auth } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();
const logger = createLogger('auth');

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (userId: string) => {
  logger.info(`为用户 ${userId} 生成 token，使用密钥: ${env.jwtSecret.substring(0, 3)}...`);
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: '7d',
  });
};

const sendCodeSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  email: z.string().email('邮箱格式不正确').optional(),
}).refine(data => data.phone || data.email, {
  message: '手机号或邮箱必须提供一个',
});

const verifyCodeSchema = z.object({
  code: z.string().length(6, '验证码长度必须为6位'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确').optional(),
  email: z.string().email('邮箱格式不正确').optional(),
}).refine(data => data.phone || data.email, {
  message: '手机号或邮箱必须提供一个',
});

// 发送验证码
router.post('/send-code', async (req, res, next) => {
  try {
    const { phone, email } = sendCodeSchema.parse(req.body);
    const contactType = phone ? 'phone' : 'email';
    const contactValue = phone || email;

    // 生成6位随机验证码
    const code = generateVerificationCode();
    logger.info(`生成的验证码: ${code}`);

    // 查找或创建用户
    let user = await User.findOne({ [contactType]: contactValue });
    if (!user) {
      user = new User({ [contactType]: contactValue });
    }

    // 保存验证码到用户记录
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5分钟有效期
    await user.save();

    // 发送验证码
    if (phone) {
      const success = await smsService.sendVerificationCode(phone, code);
      if (!success) {
        throw new AppError(500, '验证码发送失败');
      }
    } else if (email) {
      const success = await emailService.sendVerificationCode(email, code);
      if (!success) {
        throw new AppError(500, '验证码发送失败');
      }
    }

    res.json({ message: '验证码已发送' });
  } catch (error) {
    next(error);
  }
});

// 验证码登录
router.post('/login/:type(phone|email)', async (req, res, next) => {
  try {
    const { code, ...contact } = verifyCodeSchema.parse(req.body);
    const contactType = req.params.type;
    const contactValue = contact[contactType as keyof typeof contact];

    logger.info(`尝试 ${contactType} 登录: ${contactValue}`);
    
    const user = await User.findOne({
      [contactType]: contactValue,
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() },
    }) as IUser | null;

    if (!user) {
      logger.warn(`登录失败：验证码无效或已过期 - ${contactType}: ${contactValue}, 验证码: ${code}`);
      throw new AppError(401, '验证码无效或已过期');
    }

    // 清除验证码
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = generateToken(user._id.toString());
    logger.info(`用户登录成功: ${user._id}, token 生成成功`);

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 验证 token
router.get('/verify-token', auth, (req, res) => {
  logger.info(`Token 验证成功，用户 ID: ${req.user._id}`);
  res.json({ 
    success: true, 
    user: {
      id: req.user._id,
      email: req.user.email,
      phone: req.user.phone
    } 
  });
});

export default router; 