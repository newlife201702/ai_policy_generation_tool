import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { CreatePaymentOrderRequest } from '../types/payment';
import { createLogger } from '../utils/logger';

const logger = createLogger('paymentController');

export const createPaymentOrder = async (req: Request<{}, {}, CreatePaymentOrderRequest>, res: Response) => {
  try {
    const { amount, type, subType } = req.body;
    const userId = req.user?._id;

    // 检查认证信息
    if (!req.user) {
      logger.warn('用户未认证，返回401错误');
      return res.status(401).json({ message: '未授权，请先登录' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: '无效的支付金额'
      });
    }

    const result = await paymentService.createPaymentOrder(amount, userId, type, subType);

    logger.info('创建支付订单成功', {
      userId,
      amount,
      orderId: result.orderId
    });

    res.json(result);
  } catch (error) {
    logger.error('创建支付订单失败', {
      error,
      userId: req.user?.id,
      amount: req.body.amount
    });

    res.status(500).json({
      status: 'error',
      message: '创建支付订单失败'
    });
  }
};

export const getPaymentStatus = async (req: Request<{ orderId: string }>, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: '用户未登录'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        status: 'error',
        message: '订单ID不能为空'
      });
    }

    const order = await paymentService.getPaymentStatus(orderId);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: '订单不存在'
      });
    }

    // 验证订单所属用户
    if (order.userId.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: '无权访问此订单'
      });
    }

    logger.info('查询支付状态成功', {
      userId,
      orderId,
      status: order.status
    });

    res.json({
      status: order.status
    });
  } catch (error) {
    logger.error('查询支付状态失败', {
      error,
      userId: req.user?.id,
      orderId: req.params.orderId
    });

    res.status(500).json({
      status: 'error',
      message: '查询支付状态失败'
    });
  }
};

/**
 * 检查服务访问权限
 */
export const checkServiceAccess = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const userId = req.user!.id;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({ message: '缺少必要的参数：type' });
    }

    const result = await paymentService.checkUserServiceAccess(userId, type);
    res.json(result);
  } catch (error) {
    logger.error('检查服务访问权限失败', {
      error,
      userId: req.user!.id,
      type: req.query.type
    });
    res.status(500).json({ message: '检查服务访问权限失败' });
  }
};

// 支付平台回调接口
export const handlePaymentCallback = async (req: Request, res: Response) => {
  try {
    const params = req.body;
    
    // 处理支付宝异步通知
    await paymentService.handlePaymentCallback(params);

    // 返回 success 字符串，支付宝要求的格式
    res.send('success');
  } catch (error) {
    logger.error('处理支付回调失败', {
      error,
      params: req.body
    });

    // 返回 fail 字符串，这样支付宝会重试通知
    res.send('fail');
  }
}; 