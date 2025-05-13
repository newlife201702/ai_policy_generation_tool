import React, { useState } from 'react';
import { Modal, Button, Row, Col, Typography } from 'antd';
import styled from 'styled-components';
import QRCodeModal from './QRCodeModal';

const { Title, Text } = Typography;

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
  }
  .ant-modal-close {
    color: #ffffff;
  }
`;

const PaymentOption = styled.div`
  border: 1px solid #333333;
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-image: url('../../imgs/PaymentOption1.png');
  background-size: cover;
  background-position: center;

  &:hover {
    border-color: #666666;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  }

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`;

const StyledCol = styled(Col)`
  &:last-child {
    ${PaymentOption} {
      background-image: url('../../imgs/PaymentOption2.png');
    }
  }
`;

const PriceWrapper = styled.div`
  margin: 16px 0 24px;
`;

const PriceTag = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #ffffff;
  display: flex;
  align-items: baseline;
  
  .currency {
    font-size: 20px;
    margin-right: 4px;
  }
  
  .period {
    font-size: 14px;
    color: #999999;
    margin-left: 4px;
  }
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0 32px;
  text-align: left;

  li {
    color: #ffffff;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    font-size: 14px;

    &:before {
      content: "✓";
      color: #52c41a;
      margin-right: 8px;
      font-weight: bold;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const StyledButton = styled(Button)`
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-size: 16px;
  background: #ffffff;
  border: none;
  color: #000000;
  font-weight: 500;

  // &:hover, &:focus {
  //   background: #f5f5f5;
  //   color: #000000;
  // }
`;

interface PaymentOption {
  amount: number;
  title: string;
  type: string;
  subType: string;
  features: string[];
}

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  paymentOptions: PaymentOption[];
  currentPlan?: string | null;
  callback?: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ visible, onClose, paymentOptions, currentPlan, callback }) => {
  const [qrCodeVisible, setQRCodeVisible] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSubType, setSelectedSubType] = useState<string>('');

  const handlePayNow = (amount: number, type: string, subType: string) => {
    setSelectedAmount(amount);
    setSelectedType(type);
    setSelectedSubType(subType);
    setQRCodeVisible(true);
  };

  return (
    <>
      <StyledModal
        title="探索更多使用方式"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={800}
        centered
      >
        <Text style={{ color: '#999999', textAlign: 'center', display: 'block', marginBottom: '32px' }}>
          {currentPlan ? '升级你的套餐' : '选择合适你的套餐'}
        </Text>
        <Row gutter={[32, 32]}>
          {paymentOptions.map((option, index) => (
            <StyledCol key={`${option.type}-${option.subType}`} xs={24} md={12}>
              <PaymentOption>
                <Title level={3} style={{ color: '#ffffff', marginBottom: '24px', fontSize: '24px' }}>
                  {option.title}
                </Title>
                <PriceWrapper>
                  <PriceTag>
                    <span className="currency">¥</span>
                    {option.amount}
                    {/* <span className="period">/ 月</span> */}
                  </PriceTag>
                </PriceWrapper>
                <StyledButton 
                  type="primary" 
                  onClick={() => handlePayNow(option.amount, option.type, option.subType)}
                  disabled={index === 1 || currentPlan === option.subType}
                >
                  {currentPlan === option.subType ? '当前方案' : '立即支付'}
                </StyledButton>
                <FeatureList>
                  {option.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </FeatureList>
              </PaymentOption>
            </StyledCol>
          ))}
        </Row>
      </StyledModal>

      <QRCodeModal
        visible={qrCodeVisible}
        onClose={() => setQRCodeVisible(false)}
        amount={selectedAmount}
        type={selectedType}
        subType={selectedSubType}
        callback={callback}
      />
    </>
  );
};

export default PaymentModal; 