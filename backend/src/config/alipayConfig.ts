import { AlipaySdk } from 'alipay-sdk';
import fs from 'fs';
import path from 'path';

// 支付宝配置
export const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID || '',
  privateKey: fs.readFileSync(path.join(__dirname, '../../cert/private-key.pem'), 'ascii'), // 应用私钥
  alipayPublicKey: fs.readFileSync(path.join(__dirname, '../../cert/alipay-public-key.pem'), 'ascii'), // 支付宝公钥
  gateway: process.env.NODE_ENV === 'production' 
    ? 'https://openapi.alipay.com/gateway.do'
    : 'https://openapi.alipaydev.com/gateway.do', // 支付宝网关
  notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://your-domain.com/api/payment/callback', // 支付回调通知地址
  returnUrl: process.env.ALIPAY_RETURN_URL || 'http://your-domain.com/payment/result', // 支付完成后的跳转地址
};

// 创建支付宝 SDK 实例
export const alipaySdk = new AlipaySdk({
  appId: alipayConfig.appId,
  privateKey: alipayConfig.privateKey,
  alipayPublicKey: alipayConfig.alipayPublicKey,
  gateway: alipayConfig.gateway,
}); 