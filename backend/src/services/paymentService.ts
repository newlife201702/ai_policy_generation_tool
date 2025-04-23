import { alipaySdk } from '../config/alipayConfig';
import { PaymentOrder } from '../models/PaymentOrder';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('paymentService');

class PaymentService {
  /**
   * 创建支付宝支付订单
   */
  async createPaymentOrder(amount: number, userId: string): Promise<any> {
    try {
      const outTradeNo = uuidv4(); // 商户订单号

      // 调用支付宝接口创建预支付订单
      const result = await alipaySdk.exec('alipay.trade.precreate', {
        notify_url: process.env.ALIPAY_NOTIFY_URL,
        bizContent: {
          out_trade_no: outTradeNo,
          total_amount: amount.toFixed(2),
          subject: '超级个体AI策略生成工具会员服务',
          timeout_express: '30m', // 订单有效期
        },
      });

      logger.info('创建支付宝预支付订单', {
        outTradeNo,
        amount,
        userId,
        response: result
      });

      // 保存订单到数据库
      const order = await PaymentOrder.create({
        amount,
        userId,
        qrCodeUrl: result.qr_code,
        alipayTradeNo: outTradeNo,
        status: 'PENDING'
      });

      return {
        orderId: order._id,
        qrCodeUrl: result.qr_code
      };
    } catch (error) {
      logger.error('创建支付订单失败', {
        error,
        amount,
        userId
      });
      throw error;
    }
  }

  /**
   * 获取支付订单状态
   */
  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      const order = await PaymentOrder.findById(orderId);
      if (!order) {
        return null;
      }

      // 如果订单还在等待支付，则查询支付宝订单状态
      if (order.status === 'PENDING') {
        const result = await alipaySdk.exec('alipay.trade.query', {
          bizContent: {
            out_trade_no: order.alipayTradeNo
          }
        });

        logger.info('查询支付宝订单状态', {
          orderId,
          alipayTradeNo: order.alipayTradeNo,
          response: result
        });

        // 更新订单状态
        if (result.trade_status === 'TRADE_SUCCESS') {
          order.status = 'SUCCESS';
          await order.save();
        } else if (result.trade_status === 'TRADE_CLOSED') {
          order.status = 'FAILED';
          await order.save();
        }
      }

      return order;
    } catch (error) {
      logger.error('查询支付状态失败', {
        error,
        orderId
      });
      throw error;
    }
  }

  /**
   * 处理支付宝异步通知
   */
  async handlePaymentCallback(params: any): Promise<void> {
    try {
      // 验证支付宝通知签名
      const signValid = alipaySdk.checkNotifySign(params);
      if (!signValid) {
        logger.warn('支付宝回调签名验证失败', { params });
        throw new Error('签名验证失败');
      }

      const order = await PaymentOrder.findOne({
        alipayTradeNo: params.out_trade_no
      });

      if (!order) {
        logger.warn('未找到对应的订单', { params });
        return;
      }

      // 根据支付宝通知更新订单状态
      if (params.trade_status === 'TRADE_SUCCESS') {
        order.status = 'SUCCESS';
        order.metadata.set('alipayNotify', params);
        await order.save();

        logger.info('支付成功，已更新订单状态', {
          orderId: order._id,
          alipayTradeNo: params.out_trade_no
        });
      }
    } catch (error) {
      logger.error('处理支付回调失败', {
        error,
        params
      });
      throw error;
    }
  }
}

export const paymentService = new PaymentService(); 