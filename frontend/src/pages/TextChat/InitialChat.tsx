import React, { useState } from 'react';
import { Input, Button, Select, Typography, message } from 'antd';
import styled from 'styled-components';
import { api } from '../../utils/api';

const { TextArea } = Input;
const { Option } = Select;

// 响应式容器
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-image: url('/background.jpg');
  background-size: cover;
  background-position: center;
  color: white;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(4,20,36,0.8) 0%, rgba(10,42,67,0.8) 100%);
  }

  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 1000px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  padding: 6px 16px;
  margin-bottom: 40px;
  font-size: 14px;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`;

const MainTitle = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 20px;
  font-size: 36px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Description = styled.p`
  color: #cccccc;
  text-align: center;
  max-width: 800px;
  margin-bottom: 40px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
    font-size: 12px;
  }
`;

const InputSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
  max-width: 1000px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const InputBox = styled.div`
  width: 100%;
  background-color: rgba(255, 255, 255, 1);
  border-radius: 8px;
  overflow: hidden;
`;

const StyledTextArea = styled(TextArea)`
  background-color: white;
  border: none;
  color: #333;
  padding: 15px;
  
  &::placeholder {
    color: rgba(0, 0, 0, 0.45);
  }
  
  &:hover, &:focus {
    background-color: white;
    box-shadow: none;
  }
`;

const BottomSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const ModelSelect = styled(Select)`
  width: 150px;
  
  .ant-select-selector {
    background-color: rgba(255, 255, 255, 0.1) !important;
    border: none !important;
    height: 40px !important;
    padding: 4px 11px !important;
    border-radius: 6px !important;
  }
  
  .ant-select-selection-item {
    color: white !important;
    display: flex !important;
    align-items: center !important;
  }
`;

const ModelIcon = styled.img`
  width: 20px;
  height: 20px;
  margin-right: 8px;
  border-radius: 50%;
`;

const StartButton = styled(Button)`
  background-color: #1677ff;
  border: none;
  color: white;
  height: 40px;
  padding: 0 30px;
  font-size: 16px;
  border-radius: 6px;
  
  &:hover {
    background-color: #4096ff;
    color: white;
  }
`;

const InitialChat: React.FC<{
  onStartChat: (messages: any[], model: string) => void;
}> = ({ onStartChat }) => {
  const [companyInfo, setCompanyInfo] = useState('');
  const [brandGoal, setBrandGoal] = useState('');
  const [model, setModel] = useState<'deepseek' | 'gpt4'>('deepseek');
  const [loading, setLoading] = useState(false);
  
  const handleGenerateStrategy = async () => {
    if (!companyInfo.trim() || !brandGoal.trim()) {
      message.error('请填写公司信息和品牌宣传目的');
      return;
    }

    // 将内容拆分成5个部分
    const contents = [
      `公司信息: ${companyInfo}\n品牌宣传的目的: ${brandGoal}\n请提供行业数据和市场情况分析。`,
      `公司信息: ${companyInfo}\n品牌宣传的目的: ${brandGoal}\n请提供目标受众提炼和15秒黄金内容提炼。`,
      `公司信息: ${companyInfo}\n品牌宣传的目的: ${brandGoal}\n请提供产品信任和通过客户个案解决客户信任问题。`,
      `公司信息: ${companyInfo}\n品牌宣传的目的: ${brandGoal}\n请提供用户痛点挖掘及创意点。`,
      `公司信息: ${companyInfo}\n品牌宣传的目的: ${brandGoal}\n请提供营销策略建议。`
    ];

    // 调用父组件的onStartChat函数，传入拆分后的内容
    onStartChat(contents, model);
  };
  
  return (
    <Container>
      <ContentWrapper>
        <Logo>AI智能生成 自助工具</Logo>
        
        <MainTitle>帮您一键生成品牌策略</MainTitle>
        
        <Description>
          在这个竞争激烈的市场环境中，拥有一份清晰、精准的品牌策略至关重要。然而，制定品牌策略的
          过程往往复杂且耗时。现在，我们为您提供一种全新的解决方案——一键生成品牌策略，
          快速、高效地帮助您的品牌脱颖而出。
        </Description>
        
        <InputSection>
          <InputBox>
            <StyledTextArea
              placeholder="请输入您的公司介绍（公司介绍可包括产品介绍、核心优势、服务客户等 输入资料越详细结果会越准确）"
              autoSize={{ minRows: 6, maxRows: 10 }}
              value={companyInfo}
              onChange={(e) => setCompanyInfo(e.target.value)}
            />
          </InputBox>
          
          <InputBox>
            <StyledTextArea
              placeholder="请输入公司品牌相关上位目标和定位目的"
              autoSize={{ minRows: 6, maxRows: 10 }}
              value={brandGoal}
              onChange={(e) => setBrandGoal(e.target.value)}
            />
          </InputBox>
        </InputSection>
        
        <BottomSection>
          <ModelSelect
            value={model}
            onChange={(value) => setModel(value)}
            dropdownStyle={{ backgroundColor: '#1a1a1a' }}
          >
            <Option value="deepseek">
              <ModelIcon src="/deepseek-icon.png" />Deepseek
            </Option>
            <Option value="gpt4">
              <ModelIcon src="/gpt-icon.png" />GPT-4o mini
            </Option>
          </ModelSelect>
          
          <StartButton
            onClick={() => {
              console.log('点击了生成品牌策略按钮');
              handleGenerateStrategy();
            }}
            loading={loading}
            type="primary"
          >
            生成品牌策略
          </StartButton>
        </BottomSection>
      </ContentWrapper>
    </Container>
  );
};

export default InitialChat; 