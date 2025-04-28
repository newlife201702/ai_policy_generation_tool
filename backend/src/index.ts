import './config/env';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createLogger } from './utils/logger';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import imageGenRoutes from './routes/imageGen';
import paymentRoutes from './routes/payment';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import path from 'path';

const logger = createLogger('app');
const app = express();
const port = env.port;

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/image-gen', imageGenRoutes);
app.use('/api/payment', paymentRoutes);

// 错误处理
app.use(errorHandler);

// 数据库连接
mongoose
  .connect(env.mongodbUri)
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    process.exit(1); // 如果数据库连接失败，终止应用程序
  });

// 监听 MongoDB 连接事件
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// 启动服务器
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 