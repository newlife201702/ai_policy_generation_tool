import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Select, Typography, message, ConfigProvider, theme } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { DefaultOptionType } from 'antd/es/select';
import styled from 'styled-components';
import { api } from '../../utils/api';
import PaymentModal from '../../components/PaymentModal';
import axios from 'axios';
import { useAppSelector } from '../../store/hooks';
import type { SelectProps } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

// 响应式容器
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  font-size: 33px;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const Description = styled.p`
  color: #ffffff;
  text-align: center;
  max-width: 80%;
  margin-bottom: 40px;
  line-height: 1.6;
  font-size: 14px;
  
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

  // 防止移动端文本域获取焦点时页面放大
  font-size: 16px !important;
  -webkit-text-size-adjust: 100% !important;
  -ms-text-size-adjust: 100% !important;
  -moz-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
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
  background-color: #c9ff85 !important;
  border-radius: 8px;
  
  .ant-select-selector {
    background-color: #c9ff85 !important;
    border: none !important;
    height: 32px !important;
    border-radius: 8px !important;
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
  background: #c9ff85;
  border: none;
  color: black;
  padding: 0 30px;
  font-size: 16px;
  rotate: 45deg;
  
  &:hover {
    background-color: #c9ff85 !important;
    color: black !important;
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
  
  // 从URL参数获取默认值
  const urlParams = new URLSearchParams(window.location.search);
  const state = urlParams.get('state');
  const target = urlParams.get('target');
  const company = urlParams.get('company');

  const [companyInfo, setCompanyInfo] = useState(company || '');
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

  const allCountryValues = countryOptions.filter(opt => opt.value !== '全部').map(opt => opt.value);

  const [selectedCountry, setSelectedCountry] = useState<string[]>(
    state ? state.split(',').map(item => item.trim()) : ['中国']
  );
  const [targetGroup, setTargetGroup] = useState(target || '不限');
  const [model, setModel] = useState<'deepseek' | 'gpt4'>('deepseek');
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [currentPlan, setCurrentPlan] = useState('');
  const [contents, setContents] = useState<string[]>([]);
  const hasGeneratedRef = useRef(false);

  useEffect(() => {
    // 如果所有参数都存在且还未生成过，则调用handleGenerateStrategy
    if (state && target && company && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      handleGenerateStrategy();
    }
  }, [state, target, company]);

  const handleCountryChange = (value: string[]) => {
    if (value.includes('全部')) {
      // 如果"全部"被选中，选中所有子选项
      if (selectedCountry.length === allCountryValues.length) {
        // 如果已经全选，再点"全部"则反选为全不选
        setSelectedCountry([]);
      } else {
        setSelectedCountry(allCountryValues);
      }
    } else {
      // 非"全部"操作
      if (value.length === allCountryValues.length) {
        // 如果手动全选所有子选项，"全部"自动选中
        setSelectedCountry(allCountryValues);
      } else {
        setSelectedCountry(value);
      }
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
      if (!companyInfo.trim() || !selectedCountry.length || !targetGroup.trim()) {
        message.error('请填写公司信息、国家选择和目标客户');
        return;
      }

      // 将内容拆分成5个部分
      const contents = [
        `公司信息: ${companyInfo}\n国家: ${selectedCountry.join(', ')}\n目标客户: ${targetGroup}\n根据用户提供的信息，或提供的网址抓取整理出该公司的基本信息，同时通过这些基本信息，查询行业数据和市场情况，数据需要准确，可以是市场规模，行业趋势，行业白皮书等，并作出提炼和总结。返回内容标题固定为“内容总结及行业分析”`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry.join(', ')}\n目标客户: ${targetGroup}\n请提供“15秒黄金内容”提炼 ：结合市场分析行业分析数据和结果，以及公司的基本资料，根据从主要到次要的先后顺序，提炼最核心的内容 以用户视角，将提炼的内容/用户阅读核心内容的路径罗列出来（需要说明这样子规划的原因），最后整理出思维导图。返回内容标题固定为“15秒黄金内容”`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry.join(', ')}\n目标客户: ${targetGroup}\n根据罗列出的思维导图，分别说明这些内容解决客户的哪些信任问题 （按产品信任 品牌信任 价值观信任区分）。返回内容标题固定为“三大信任提炼”`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry.join(', ')}\n目标客户: ${targetGroup}\n根据客户做大的卖点，用巅峰体验做为标题：提供视觉或者文案内容的创意，达到让浏览公司品牌门户网站时，用户眼前一亮并且产生深刻记忆点，可提供多种方案，并建议客户品牌主视觉采用什么样的元素和色彩搭配，同时说明原因。返回内容标题固定为“巅峰体验”`,
        `公司信息: ${companyInfo}\n国家: ${selectedCountry.join(', ')}\n目标客户: ${targetGroup}\n根据客户要推广的国家，和客户群体类型，结合目前当地的网络推广途径，为客户整理出一套完善的品牌线上营销策略，越详细越好。返回内容标题固定为“线上营销策略”`
      ];
      setContents(contents);

      if (canUse) {
        // 调用父组件的onStartChat函数，传入拆分后的内容
        onStartChat(contents, model);
      } else {
        // 显示支付选择弹窗
        const paymentOptions: PaymentOption[] = [
          {
            amount: 9.9,
            // amount: 0.01,
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
        {/* <Logo>AI智能生成 归纳工具</Logo> */}
        
        <MainTitle>一键帮助您快速生成品牌策略</MainTitle>
        
        <Description>
          围绕super-i“15秒黄金法则” “颠覆体验” 核心方法论，为您快速分析行业趋势，提供可模块化调整的品牌内容视觉和营销策略
        </Description>
        
        <InputBottomSection>
          <InputSection>
            <InputBox>
              <StyledTextArea
                placeholder="请输入公司官网地址或提交详细的公司资料（如公司简介 产品介绍 核心优势 等信息越详细越好）"
                autoSize={{ minRows: 6, maxRows: 10 }}
                value={companyInfo}
                onChange={(e) => setCompanyInfo(e.target.value)}
              />
              <SelectWrapper>
                <StyledSelect
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  showSearch={false}
                  optionFilterProp="children"
                  filterOption={filterOption}
                  options={countryOptions}
                  mode="multiple"
                  maxTagCount="responsive"
                  placeholder="请选择国家"
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
              {/* <Option value="gpt4">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ModelIcon src="../../../imgs/gpt-icon.png" />GPT-4o mini
                </div>
              </Option> */}
            </ModelSelect>
            
            <StartButton
              shape="circle"
              icon={<ArrowUpOutlined />}
              onClick={() => {
                console.log('点击了生成品牌策略按钮');
                handleGenerateStrategy();
              }}
              loading={loading}
              type="primary"
            >
            </StartButton>
          </BottomSection>
        </InputBottomSection>
      </ContentWrapper>
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
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
      </ConfigProvider>
    </Container>
  );
};

export default InitialChat; 