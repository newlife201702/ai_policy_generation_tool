import { AlipaySdk } from 'alipay-sdk';
import fs from 'fs';
import path from 'path';

// 支付宝配置
export const alipayConfig = {
  appId: process.env.ALIPAY_APP_ID || '',
  privateKey: 'MIIEowIBAAKCAQEAifTGOttuGImZ055x+3gUtjapw4Whli/o1qNh87No9o1kIULRFIVjFhxjfZmyjcJsLsqfCnECk7zxl/KHT7nDLAJfEdDZKO5FnH4IVwr/lPWjoMKgoP44w1LnjTZSBpxZIoeglidZ2of0kRoWW1R91tY7mQ8l0zU0yRrPcSWdyKo9EGkdMeLXD6Dw1i/g1lIUI55EWKsNPmvjHihzy7g8zvqcqnXXwfPKl+PkscnBz+lqtuDPBuXqmvocMF6JkgBmzBXPO2iermYvk3hK9bwgBg58wYAl6z2rbQN63MmmlUXLLWuCDZAvwL6mbYEGywEW+u2oCulcRHgMM3C4k3iDywIDAQABAoIBAA1GMjTDnGpcAyMrocgSm9uUku0vVIcBASR2ABzU7IqcvD+/ECMrWodsH96cBWRCiupNsNPuX9MbYRu/yGlRdIgtijxKnjqkAqq2LdNCSalpoV78mzwieg/BUGp0CZx9Os5pwnfwPWMbpdq4aeJL1PfxETb/ECKsgfG/1KoMdowyQRFgXhu8e7/N3Q/47vLosGqUVd1H+0IrLtNC+Lq0yNs9b6tJBhIXGxqyoUSID+FpBEQ3JRvVt+kVfyogga7d/QUGELY3AW/qJREg6elCz5VAU50MuRTiFXWUZ2BUcAIAX3mxaIpWU9lXjjMMTdUHRzufi+MKO8bRgi86PnXq8NECgYEAwuu/G4JPdI8JNNUfn/jx/RKRmZIlVSqqLFxvgK2OOTXnMxmSE6SyjcOMOgkU2Frisu7WzcoaqQgfHSTLNo3rlEpgdADeDY6naniBG8oh5LRA/duVGn8Mal/wyo5DJbyWQChoVqfePEe2EsJjsUaOEIYtUoX/xugvEj8Zfe7y2ycCgYEAtS9nh+SSBn/gsPf4WGq/CBNfoLkhv8jMT0ymroXyqJSEZTvFlq60PSmGMPxH71MNJS3MFRcBgMpAuGxKA+DwNYU8okLA0U9XSnP0DoYaUbnlKzbFsNPovDvYb1KsfNmlAl6xuVUD8qyda9wNoM9YTWG4enAfTLtPL/+wt0RAiL0CgYALspQkdXyJNTBLQGMGea0kD+I3AiNFaisOQHnckg3P9yEp2uX+Ucr5YPvgW70pgsLKFDVF4lQZQsiDOjsLyhaSLqh9LbQlwiLf691rqoTAMeUYlv3quicnlxxfO4xiDmBB92rTkH1wxqjxlULgV6ic60B7DFmeOT7h7HF+MkHWzwKBgAWGEnP0JfeIwoLirHGVn4lRfeLaggrkxkXMonBDqSg2juq/LcDwRpJux6aKqm7Da20svkIOV39jqyF0O7VukCQxka2ot1QqRRECA/jFYdwH/NKacuB3NWs3r9uE+7k6sWsnE+gAjYRCevIk3U1/xMNnLUaeUHX4Z+ugsfSEYitJAoGBALjkvqRAzqPqiAlibDeypCpkrSpFvsiOE/eSZoLqKbvvvdrATn8gPmeBCgzSwQBL4UddnF4bwXi3ZXW5r+xybViBOhSXPEkm8kc1isS6+aWJosYf78xC8abwhiTxwoOKFywbDsyVsOIOlXHf7K7wu8ccQ4a02/mO1qjEMDp0VmYa', // 应用私钥
  alipayPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwG8ZCQXrUewkh/BMz09tgL6dTJ6pvO6c7ErF+ZXsIEtE5XfPUJzDEPrTuz4bLl+lgt1SYuHng9G0yeVAJDkJ0bqecSKxf/XHe139dO1lexd54Fe3qO/RPe8Uuv/VNvB62cNBWf7j3tATBzsl6s8zcKHyQA1PO/U+Ws7TwE+p6o0J0M8ifkHHV/Nh43I8sUVexyW9fC2btJqysb4riw9rtNKeYmax6ZaxjN+0OPX5LM6pSGV+JsSrcf2M/eglaP915DN0OyX4fUwrX65abhJ2SuJfLhq2MveaDDr3gT6913WRj+MzXB1kOfDMGv9VyUEK6MnW9Qw50TbGpLsCttaagQIDAQAB', // 支付宝公钥
  gateway: process.env.NODE_ENV === 'production' 
    ? 'https://openapi.alipay.com/gateway.do'
    : 'https://openapi.alipay.com/gateway.do', // 支付宝网关
  notifyUrl: process.env.ALIPAY_NOTIFY_URL || 'http://your-domain.com/api/payment/callback', // 支付回调通知地址
  returnUrl: process.env.ALIPAY_RETURN_URL || 'http://your-domain.com/payment/result', // 支付完成后的跳转地址
  encryptKey: process.env.ENCRYPT_KEY
};

// 创建支付宝 SDK 实例
export const alipaySdk = new AlipaySdk({
  appId: alipayConfig.appId,
  privateKey: alipayConfig.privateKey,
  alipayPublicKey: alipayConfig.alipayPublicKey,
  gateway: alipayConfig.gateway,
  // encryptKey: alipayConfig.encryptKey
}); 