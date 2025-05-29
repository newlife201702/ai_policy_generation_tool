import { alipaySdk } from '../config/alipayConfig';
import { PaymentOrder } from '../models/PaymentOrder';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user';

const logger = createLogger('paymentService');

class PaymentService {
  /**
   * 创建支付宝支付订单
   */
  async createPaymentOrder(amount: number, userId: string, type: string, subType: string): Promise<any> {
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
        type,
        subType,
        response: result
      });

      // 保存订单到数据库
      const order = await PaymentOrder.create({
        amount,
        userId,
        type,
        subType,
        qrCodeUrl: result.qrCode,
        alipayTradeNo: outTradeNo,
        status: 'PENDING'
      });

      return {
        orderId: order._id,
        qrCodeUrl: result.qrCode
      };
    } catch (error) {
      logger.error('创建支付订单失败', {
        error,
        amount,
        userId,
        type,
        subType
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
        console.log('result', result);

        logger.info('查询支付宝订单状态', {
          orderId,
          alipayTradeNo: order.alipayTradeNo,
          response: result
        });

        // 更新订单状态
        if (result.tradeStatus === 'TRADE_SUCCESS') {
          order.status = 'SUCCESS';
          await order.save();
        
          // 根据订单类型增加用户的使用次数
          const user = await User.findById(order.userId);
          // console.log('userId-order', order.userId, 'user-order', user);
          if (user) {
            if (order.type === 'brand_explorer') {
              user.textChatRemainingCount += 100;
            } else if (order.type === 'gpt4_drawing') {
              user.imageGenRemainingCount += 50;
            }
            await user.save();
          }
        } else if (result.tradeStatus === 'TRADE_CLOSED') {
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

  /**
   * 查询用户的付费状态
   * @param userId 用户ID
   * @param type 产品类型
   * @returns null 如果未付费，否则返回付费订单信息
   */
  async getUserPaymentStatus(userId: string, type: string): Promise<any> {
    try {
      // 查找用户最新的成功支付订单
      const order = await PaymentOrder.findOne({
        userId,
        type,
        status: 'SUCCESS'
      }).sort({ createdAt: -1 });

      return order;
    } catch (error) {
      logger.error('查询用户付费状态失败', {
        error,
        userId,
        type
      });
      throw error;
    }
  }

  /**
   * 获取用户服务可使用次数
   * @param userId 用户ID
   * @param type 产品类型
   * @param startDate 开始计数的日期
   */
  private async getUserServiceUsage(userId: string, type: string, startDate: Date): Promise<number> {
    try {
      const user = await User.findById(userId);
      // console.log('userId-Usage', userId, 'user-Usage', user);
      if (!user) {
        throw new Error('用户不存在');
      }

      if (type === 'brand_explorer') {
        return user.textChatRemainingCount || 0;
      } else if (type === 'gpt4_drawing') {
        return user.imageGenRemainingCount || 0;
      }

      return 0;
    } catch (error) {
      logger.error('获取用户服务可使用次数失败', {
        error,
        userId,
        type
      });
      throw error;
    }
  }

  /**
   * 检查用户是否可以继续使用服务
   * @param userId 用户ID
   * @param type 产品类型
   * @returns { canUse: boolean, needPayment: boolean, currentPlan: string | null }
   */
  async checkUserServiceAccess(userId: string, type: string): Promise<{
    canUse: boolean;
    needPayment: boolean;
    currentPlan: string | null;
  }> {
    try {
      const order = await this.getUserPaymentStatus(userId, type);

      if (!order) {
        return {
          canUse: false,
          needPayment: true,
          currentPlan: null
        };
      }

      // 如果是基础版，需要检查使用次数
      if (order.subType === 'basic') {
        // 获取用户当前剩余使用次数
        const remainingCount = await this.getUserServiceUsage(userId, type, order.createdAt);
        
        // 如果剩余次数为0，则不能继续使用
        // if (remainingCount <= 0) {
        if (false) {
          return {
            canUse: false,
            needPayment: true,
            // currentPlan: 'basic'
            currentPlan: null
          };
        }
      }

      // 高级版或基础版有剩余次数，可以继续使用
      return {
        canUse: true,
        needPayment: false,
        currentPlan: order.subType
      };
    } catch (error) {
      logger.error('检查用户服务访问权限失败', {
        error,
        userId,
        type
      });
      throw error;
    }
  }
}

export const paymentService = new PaymentService(); 