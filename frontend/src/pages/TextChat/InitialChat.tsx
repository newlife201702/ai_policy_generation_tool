import React, { useState } from 'react';
import { Input, Button, Select, Typography, message } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { DefaultOptionType } from 'antd/es/select';
import styled from 'styled-components';
import { api } from '../../utils/api';
import PaymentModal from '../../components/PaymentModal';
import axios from 'axios';
import { useAppSelector } from '../../store/hooks';
import type { SelectProps } from 'antd';

const { TextArea } = Input;
const { Option } = Select;

// 响应式容器
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  // margin-top: 56px;
  // height: calc(100vh - 56px);
  height: calc(100vh);
  padding: 20px;
  padding-top: 56px;
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
  position: relative;
`;

const StyledTextArea = styled(TextArea)<TextAreaProps>`
  background-color: white;
  border: none;
  color: #333;
  padding: 15px;
  padding-bottom: 60px; // 为下拉框留出空间
  
  &::placeholder {
    color: rgba(0, 0, 0, 0.45);
  }
  
  &:hover, &:focus {
    background-color: white;
    box-shadow: none;
  }
`;

const SelectWrapper = styled.div`
  position: absolute;
  left: 15px;
  bottom: 15px;
  display: flex;
  gap: 10px;
  z-index: 1;
`;

const StyledSelect = styled(Select)`
  width: 120px;
  height: 32px;
  background-color: #f5f5f5 !important;
  border-radius: 4px;
  
  .ant-select-selector {
    background-color: #f5f5f5 !important;
    border: none !important;
    height: 32px !important;
    padding: 4px 11px !important;
    border-radius: 4px !important;
  }
  
  .ant-select-selection-item {
    color: rgba(0, 7, 20, 0.62) !important;
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

interface PaymentOption {
  amount: number;
  title: string;
  type: string;
  subType: string;
  features: string[];
}

interface CountryOption {
  value: string;
  label: string;
}

const InitialChat: React.FC<{
  onStartChat: (messages: any[], model: string) => void;
}> = ({ onStartChat }) => {
  const { token } = useAppSelector((state) => state.auth);
  const [companyInfo, setCompanyInfo] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('全部');
  const [targetGroup, setTargetGroup] = useState('不限');
  const [model, setModel] = useState<'deepseek' | 'gpt4'>('deepseek');
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [currentPlan, setCurrentPlan] = useState('');
  const [contents, setContents] = useState<string[]>([]);

  const countryOptions: CountryOption[] = [
    { value: '全部', label: '全部' },
    { value: '中国', label: '中国' },
    { value: '美国', label: '美国' },
    { value: '日本', label: '日本' },
    { value: '韩国', label: '韩国' },
    { value: '英国', label: '英国' },
    { value: '德国', label: '德国' },
    { value: '法国', label: '法国' },
    { value: '意大利', label: '意大利' },
    { value: '西班牙', label: '西班牙' },
    { value: '俄罗斯', label: '俄罗斯' },
    { value: '加拿大', label: '加拿大' },
    { value: '澳大利亚', label: '澳大利亚' },
    { value: '巴西', label: '巴西' },
    { value: '印度', label: '印度' },
  ];

  const handleCountryChange: SelectProps['onChange'] = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedCountry(value);
    } else if (Array.isArray(value) && value.length > 0) {
      setSelectedCountry(value[0]);
    }
  };

  const handleTargetGroupChange: SelectProps['onChange'] = (value: string | string[]) => {
    if (typeof value === 'string') {
      setTargetGroup(value);
    } else if (Array.isArray(value) && value.length > 0) {
      setTargetGroup(value[0]);
    }
  };

  const handleModelChange: SelectProps['onChange'] = (value: string | string[]) => {
    if (typeof value === 'string' && (value === 'deepseek' || value === 'gpt4')) {
      setModel(value);
    } else if (Array.isArray(value) && value.length > 0 && (value[0] === 'deepseek' || value[0] === 'gpt4')) {
      setModel(value[0]);
    }
  };

  const handleGenerateStrategy = async () => {
    try {
      // 检查用户是否有权限使用服务
      const response = await axios.get('/api/payment/check-access', {
        params: {
          type: 'brand_explorer'
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      const { canUse, needPayment, currentPlan } = response.data;
  
      // 继续执行生成策略的逻辑
      if (!companyInfo.trim() || !selectedCountry.trim() || !targetGroup.trim()) {
        message.error('请填写公司信息、国家选择和目标客户');
        return;
      }

      // 将内容拆分成5个部分
      const contents = [
        `公司信息: ${companyInfo}\n国家: ${selectedCountry}\n目标客户: ${targetGroup}\n请提供行业数据和市场情况分析（联网查询该行业相关信息并进行市场行业和趋势分析）。`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry}\n目标客户: ${targetGroup}\n请提供15秒黄金内容提炼 ：结合市场分析结果，提炼公司最有优势且最契合用户宣传目的的关键优势提炼最核心的内容 按内容提炼/内容层次划分/用户阅读路径三个点罗列出来，并说明为什么要这么罗列的原因。`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry}\n目标客户: ${targetGroup}\n根据罗列的内容分别说明，通过罗列的内容分别说明这些内容解决客户的哪些信任问题 （按产品信任 品牌信任 价值观信任区分）。`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry}\n目标客户: ${targetGroup}\n根据客户做大的卖点，用巅峰体验做为标题：提供视觉或者文案内容的创意达到让浏览公司品牌门户网站时，用户眼前一亮并且产生深刻记忆点，可提供多种方案。`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry}\n目标客户: ${targetGroup}\n根据以上全部内容，结合目前的网络推广途径，为客户整理出一套完善的品牌线上营销策略。`
      ];
      setContents(contents);

      if (canUse) {
        // 调用父组件的onStartChat函数，传入拆分后的内容
        onStartChat(contents, model);
      } else {
        // 显示支付选择弹窗
        const paymentOptions: PaymentOption[] = [
          {
            // amount: 9.9,
            amount: 0.01,
            title: '开通品牌探索流',
            type: 'brand_explorer',
            subType: 'basic',
            features: [
              '可以使用思维导图生成',
              '100次对话',
              '可以修改内容',
              '支持商用'
            ]
          },
          {
            amount: 99,
            title: '开通品牌探索流',
            type: 'brand_explorer',
            subType: 'premium',
            features: [
              '可以使用思维导图生成',
              '可以无限生成',
              '可以修改内容',
              '支持商用'
            ]
          }
        ];

        setPaymentModalVisible(true);
        setPaymentOptions(paymentOptions);
        setCurrentPlan(currentPlan);
      }
    } catch (error) {
      message.error('检查服务访问权限失败');
    }
  };

  const filterOption = (input: string, option?: DefaultOptionType) => {
    return (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase());
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
              <SelectWrapper>
                <StyledSelect
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  showSearch
                  optionFilterProp="children"
                  filterOption={filterOption}
                  options={countryOptions}
                />
                <StyledSelect
                  value={targetGroup}
                  onChange={handleTargetGroupChange}
                >
                  <Option value="不限">不限</Option>
                  <Option value="B端客户">B端客户</Option>
                  <Option value="C端客户">C端客户</Option>
                </StyledSelect>
              </SelectWrapper>
            </InputBox>
          </InputSection>
          
          <BottomSection>
            <ModelSelect
              value={model}
              onChange={handleModelChange}
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
      <PaymentModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        paymentOptions={paymentOptions}
        currentPlan={currentPlan}
        callback={() => {
          setPaymentModalVisible(false);
          // 调用父组件的onStartChat函数，传入拆分后的内容
          onStartChat(contents, model);
        }}
      />
    </Container>
  );
};

export default InitialChat; 