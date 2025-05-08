import React, { useEffect, useState } from 'react';
import { Modal, Spin, message } from 'antd';
import { QRCode } from 'antd';
import styled from 'styled-components';
import axios from 'axios';
import { useAppSelector } from '../store/hooks';

const StyledModal = styled(Modal)`
  .ant-modal-content {
    background: #1a1a1a;
    border-radius: 16px;
  }
  .ant-modal-header {
    background: #1a1a1a;
    border-bottom: none;
    border-radius: 16px 16px 0 0;
  }
  .ant-modal-title {
    color: #ffffff;
    text-align: center;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .amount {
      color: #52c41a;
      margin-left: 8px;
    }
  }
  .ant-modal-close {
    color: #ffffff;
  }
`;

const QRCodeWrapper = styled.div`
  text-align: center;
  padding: 20px 20px 32px;

  .qr-container {
    background: #ffffff;
    padding: 16px;
    border-radius: 12px;
    display: inline-block;
    margin: 0 0 20px;
  }

  .payment-hint {
    color: #999999;
    font-size: 14px;
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    .alipay-icon {
      width: 25px;
      height: 25px;
      margin-left: 4px;
    }
  }

  .agreement {
    color: #666666;
    font-size: 12px;
    margin-top: 24px;
    
    a {
      color: #666666;
      text-decoration: none;
      
      &:hover {
        color: #999999;
      }
    }
  }
`;

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  type: string;
  subType: string;
  callback?: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, onClose, amount, type, subType, callback }) => {
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
      const response = await axios.post('/api/payment/create', {
        amount,
        type,
        subType
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setQrCodeUrl(response.data.qrCodeUrl);
      setOrderId(response.data.orderId);
      
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
        const response = await axios.get(`/api/payment/status/${orderId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.data.status === 'SUCCESS') {
          clearInterval(pollInterval);
          message.success('支付成功！');
          callback?.();
          onClose();
        }
      } catch (error) {
        console.error('轮询支付状态失败:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  };

  return (
    <StyledModal
      title={<>扫码支付<span className="amount">{amount}元</span></>}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={400}
      centered
    >
      <QRCodeWrapper>
        {loading ? (
          <div style={{ padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div className="qr-container">
            <QRCode
              value={qrCodeUrl || '-'}
              size={200}
              style={{ margin: '0 auto' }}
              color="#000000"
              bordered={false}
            />
          </div>
        )}
        <div className="payment-hint">
          请扫码完成支付
          <img 
            src="../../imgs/zhifubao-icon.png" 
            alt="支付宝" 
            className="alipay-icon"
          />
        </div>
        <div className="agreement">
          <a href="#" onClick={(e) => { e.preventDefault(); message.info('"超级个体"付费服务协议'); }}>《"超级个体"付费服务协议》</a>
        </div>
      </QRCodeWrapper>
    </StyledModal>
  );
};

export default QRCodeModal; 