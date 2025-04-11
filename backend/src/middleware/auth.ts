import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user';
import { AppError } from './errorHandler';
import { createLogger } from '../utils/logger';
import { env } from '../config/env';

const logger = createLogger('auth');

declare global {
  namespace Express {
    interface Request {
      user: any;
      token: string;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    logger.info(`认证中间件收到请求: ${req.method} ${req.path}`);
    logger.info(`Authorization 头: ${req.header('Authorization') ? '存在' : '不存在'}`);
    
    if (!token) {
      logger.warn('Token 不存在');
      throw new AppError(401, '请先登录');
    }
    
    try {
      logger.info(`尝试验证 token，使用密钥: ${env.jwtSecret.substring(0, 3)}...`);
      const decoded = jwt.verify(token, env.jwtSecret) as {
        userId: string;
      };
      logger.info(`Token 解码成功, 用户ID: ${decoded.userId}`);

      const user = await User.findById(decoded.userId);

      if (!user) {
        logger.warn(`用户不存在: ${decoded.userId}`);
        throw new AppError(401, '用户不存在');
      }

      logger.info(`用户认证成功: ${user._id}`);
      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      logger.error(`JWT 验证失败: ${jwtError instanceof Error ? jwtError.message : '未知错误'}`);
      if (jwtError instanceof jwt.JsonWebTokenError) {
        next(new AppError(401, '无效的token'));
      } else {
        next(jwtError);
      }
    }
  } catch (error) {
    next(error);
  }
}; 