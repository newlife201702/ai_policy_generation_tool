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
    console.log('生成品牌策略按钮被点击');
    
    if (!companyInfo.trim()) {
      message.warning('请输入公司介绍');
      return;
    }
    
    setLoading(true);
    console.log('正在准备生成策略数据', { companyInfo, brandGoal, model });
    
    try {
      const messages = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: `公司信息: ${companyInfo}
${brandGoal ? `品牌宣传的目的: ${brandGoal}` : ''}

根据客户提供的公司信息和品牌宣传的目的，为客户输出以下五个模块的结果
模块一：行业数据 及 市场情况分析  （联网查询该行业相关信息并进行市场行业和趋势分析）

模块二：15秒黄金内容提炼 ：结合市场分析结果，提炼公司最有优势且最契合用户宣传目的的关键优势提炼最核心的内容 按内容提炼/  内容层次划分/用户阅读路径三个点罗列出来，并说明为什么要这么罗列的原因。

模块三：根据罗列的内容分别说明，通过罗列的内容分别说明这些内容解决客户的哪些信任问题 （按产品信任 品牌信任 价值观信任区分）

模块四：根据客户做大的卖点，用巅峰体验做为标题：提供视觉或者文案内容的创意达到让浏览公司品牌门户网站时，用户眼前一亮并且产生深刻记忆点，可提供多种方案。

模块五：根据以上全部内容，结合目前的网络推广途径，为客户整理出一套完善的品牌线上营销策略

输出的五个模块的结果以“======”作为分隔符进行分隔，方便我获取整个结果后通过分隔符进行分隔分别得到五个模块的结果`,
          timestamp: new Date().toISOString()
        }
      ];
      
      console.log('调用onStartChat函数', messages);
      onStartChat(messages, model);
    } catch (error) {
      console.error('生成策略失败:', error);
      message.error('生成失败，请稍后重试');
    } finally {
      setLoading(false);
    }
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