import React, { useEffect, useState } from 'react';
import { Modal, Spin, Typography, message } from 'antd';
import { QRCode } from 'antd';
import axios from 'axios';
import { useAppSelector } from '../../../frontend/src/store/hooks';

const { Title, Text } = Typography;

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, onClose, amount }) => {
  const { token } = useAppSelector((state) => state.auth);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    if (visible && amount > 0) {
      generateQRCode();
    }
  }, [visible, amount]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      // 这里替换为实际的API调用
      const response = await axios.post('/api/payment/create', {
        amount,
      },{
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setQrCodeUrl(response.data.qrCodeUrl);
      setOrderId(response.data.orderId);
      
      // 开始轮询支付状态
      startPollingPaymentStatus(response.data.orderId);
    } catch (error) {
      message.error('生成支付二维码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const startPollingPaymentStatus = (orderId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payment/status/${orderId}`);
        if (response.data.status === 'SUCCESS') {
          clearInterval(pollInterval);
          message.success('支付成功！');
          onClose();
        }
      } catch (error) {
        console.error('轮询支付状态失败:', error);
      }
    }, 3000); // 每3秒检查一次

    // 清理函数
    return () => clearInterval(pollInterval);
  };

  return (
    <Modal
      title="扫码支付"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div style={{ textAlign: 'center' }}>
        <Title level={4}>支付金额：¥{amount}</Title>
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ padding: '20px 0' }}>
            <QRCode
              value={qrCodeUrl || '-'}
              size={200}
              style={{ margin: '0 auto' }}
            />
          </div>
        )}
        <Text type="secondary">
          请使用微信或支付宝扫描二维码完成支付
        </Text>
      </div>
    </Modal>
  );
};

export default QRCodeModal; 