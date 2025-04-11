import { Request, Response, NextFunction } from 'express';
import { Schema } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('validateRequest');

export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      logger.warn('请求验证失败:', error);
      res.status(400).json({ 
        message: '请求参数无效', 
        errors: error.errors 
      });
    }
  };
}; 