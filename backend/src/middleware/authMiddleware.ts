import { auth } from './auth';

// 重新导出auth中间件，保持兼容性
export const authMiddleware = auth; 