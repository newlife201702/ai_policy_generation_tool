import React, { useState } from 'react';
import { Modal, Button, Row, Col, Typography } from 'antd';
import styled from 'styled-components';
import QRCodeModal from './QRCodeModal';

const { Title, Text } = Typography;

const PaymentOption = styled.div`
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 20px;
  margin: 10px 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const PriceTag = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: #f5222d;
`;

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ visible, onClose }) => {
  const [qrCodeVisible, setQRCodeVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);

  const paymentOptions = [
    { amount: 99, description: '单次使用' },
    { amount: 299, description: '月度会员' },
    { amount: 999, description: '年度会员' },
  ];

  const handlePayNow = (amount: number) => {
    setSelectedAmount(amount);
    setQRCodeVisible(true);
  };

  return (
    <>
      <Modal
        title="选择支付方式"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
      >
        <Row gutter={[16, 16]}>
          {paymentOptions.map((option) => (
            <Col key={option.amount} xs={24} sm={8}>
              <PaymentOption>
                <Title level={4}>{option.description}</Title>
                <PriceTag>¥{option.amount}</PriceTag>
                <div style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => handlePayNow(option.amount)}>
                    立即支付
                  </Button>
                </div>
              </PaymentOption>
            </Col>
          ))}
        </Row>
      </Modal>

      <QRCodeModal
        visible={qrCodeVisible}
        onClose={() => setQRCodeVisible(false)}
        amount={selectedAmount}
      />
    </>
  );
};

export default PaymentModal; 