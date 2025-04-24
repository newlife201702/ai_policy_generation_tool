import { Router } from 'express';
import { createPaymentOrder, getPaymentStatus, handlePaymentCallback, checkServiceAccess } from '../controllers/paymentController';
import { auth } from '../middleware/auth';

const router = Router();

// 创建支付订单
router.post('/create', auth, createPaymentOrder);

// 查询支付状态
router.get('/status/:orderId', auth, getPaymentStatus);

// 检查服务访问权限
router.get('/check-access', auth, checkServiceAccess);

// 支付平台回调接口
router.post('/callback/:orderId', handlePaymentCallback);

export default router; 