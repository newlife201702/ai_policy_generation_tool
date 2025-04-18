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
  margin-top: 56px;
  height: calc(100vh - 56px);
  padding: 20px;
  background-image: url('../../../imgs/background.png');
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
  background: linear-gradient(78deg, rgba(255, 255, 255, 0.00) 0%, rgba(255, 255, 255, 0.10) 100%), #1B1918;
  border-radius: 20px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
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
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Description = styled.p`
  color: #cccccc;
  text-align: center;
  max-width: 810px;
  margin-bottom: 40px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
    font-size: 12px;
  }
`;

const InputBottomSection = styled.div`
  padding: 8px;
  width: 100%;
  max-width: 1000px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.10) 100%);
`;

const InputSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
  margin-bottom: 8px;
  
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
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const ModelSelect = styled(Select)`
  width: 150px;
  height: 40px;
  
  .ant-select-selector {
    background-color: #E5E5E5 !important;
    border: none !important;
    height: 40px !important;
    padding: 4px 11px !important;
    border-radius: 6px !important;
  }
  
  .ant-select-selection-item {
    color: rgba(0, 7, 20, 0.62) !important;
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
  background: rgba(163, 163, 163, 0.20);
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
        <Logo>AI智能生成 归纳工具</Logo>
        
        <MainTitle>帮您一键生成品牌策略</MainTitle>
        
        <Description>
          在这个竞争激烈的市场环境中，拥有一份清晰、精准的品牌策略至关重要。然而，制定品牌策略的
          过程往往复杂且耗时。现在，我们为您提供一种全新的解决方案——一键生成品牌策略，
          快速、高效地帮助您的品牌脱颖而出。
        </Description>
        
        <InputBottomSection>
          <InputSection>
            <InputBox>
              <StyledTextArea
                placeholder="请输入您的公司介绍（公司介绍里可以包含产品介绍 核心优势 服务客户等 导入资料越详细结果会越准确)"
                autoSize={{ minRows: 6, maxRows: 10 }}
                value={companyInfo}
                onChange={(e) => setCompanyInfo(e.target.value)}
              />
            </InputBox>
            
            <InputBox>
              <StyledTextArea
                placeholder="请输入您公司品牌线上宣传最主要的目的"
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
            >
              <Option value="deepseek">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ModelIcon src="../../../imgs/deepseek-icon.png" />Deepseek
                </div>
              </Option>
              <Option value="gpt4">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ModelIcon src="../../../imgs/gpt-icon.png" />GPT-4o mini
                </div>
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
              一键生成品牌线上化生态策略 ↵
            </StartButton>
          </BottomSection>
        </InputBottomSection>
      </ContentWrapper>
    </Container>
  );
};

export default InitialChat; 