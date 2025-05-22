import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input, Button, Upload, message, Spin, ConfigProvider, theme } from 'antd';
import { UploadOutlined, ArrowUpOutlined, CloseCircleFilled } from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';
import { useAppSelector } from '../../store/hooks';
import ConversationList from './components/ConversationList';
import ImageDisplay from './components/ImageDisplay';
import EmptyState from './components/EmptyState';
import PaymentModal from '../../components/PaymentModal';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../components/PageTitle';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  height: 100vh;
  background-image: url('../../../imgs/background.png');
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: row;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MainContent = styled(Content)`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const ContentArea = styled.div<{ $isEmpty: boolean }>`
  flex: 1;
  overflow-y: auto;
  scrollBehavior: 'smooth' // 关键代码：添加平滑滚动
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: ${props => props.$isEmpty ? 'center' : 'flex-start'};
  padding: 0 20px;
  
  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 6px;
    transition: background 0.2s;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
`;

const InputArea = styled.div`
  display: flex;
  gap: 10px;
  padding: 20px;
  background: #1a1a1a;
  border-radius: 8px;
  align-items: flex-start;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
`;

const StyledTextArea = styled(Input.TextArea)`
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
  padding: 15px;
  
  &:hover, &:focus {
    border-color: #666;
  }

  .ant-input {
    background: #1a1a1a;
    color: #fff;
  }

  // 防止移动端文本域获取焦点时页面放大
  font-size: 16px !important;
  -webkit-text-size-adjust: 100% !important;
  -ms-text-size-adjust: 100% !important;
  -moz-text-size-adjust: 100% !important;
  text-size-adjust: 100% !important;
`;

const StyledUpload = styled(Upload)`
  .ant-upload-list {
    display: none;
  }

  .ant-btn {
    background: #c9ff85;
    border: none;
    
    &:hover {
      background: #c9ff85 !important;
      border-color: #666;
      color: #000 !important;
    }
  }

  position: absolute;
  left: 135px;
  bottom: 15px;
  z-index: 1000;
`;

const ModelIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
`;

const SendButton = styled(Button)`
  background: #c9ff85;
  
  border: none;
  color: black;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  rotate: 45deg;
  
  &:hover, &:focus {
    background: #c9ff85 !important;
    border-color: #666;
    color: black !important;
  }

  &:disabled {
    background: #1a1a1a;
    border-color: #333;
    color: #666;
  }
`;

const ButtonGroup = styled.div`
  position: absolute;
  top: 20px;
  right: 40px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const HomeButton = styled(Button)`
  position: absolute;
  top: 20px;
  left: 40px;
  z-index: 10;
`;

interface Image {
  prompt: string;
  url: string;
  timestamp: Date;
  model: 'GPT-4o';
  type: 'text2img' | 'img2img';
  sourceImage?: string;
}

interface Conversation {
  _id: string;
  userId: string;
  title: string;
  model: 'GPT-4o';
  images: Image[];
  type: 'image';
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentOption {
  amount: number;
  title: string;
  type: string;
  subType: string;
  features: string[];
}

const ImageGen: React.FC = () => {
  // 从URL参数获取默认值
  const urlParams = new URLSearchParams(window.location.search);
  const promptValue = urlParams.get('prompt');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(promptValue || '');
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [imageIndex, setImageIndex] = useState<number>(-1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [currentPlan, setCurrentPlan] = useState('');
  const hasGeneratedRef = useRef(false);
  const { token } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    if (promptValue && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true;
      beforeSubmit();
    }
  }, [promptValue]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/image-gen', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      message.error('获取对话记录失败');
    }
  };

  const handleImageUpload = (info: any) => {
    const file = info.file.originFileObj;
    if (file) {
      setUploading(true);
      const previewUrl = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreview(previewUrl);
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const beforeSubmit = async () => {
    try {
      // 检查用户是否有权限使用服务
      const response = await axios.get('/api/payment/check-access', {
        params: {
          type: 'gpt4_drawing'
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
  
      const { canUse, needPayment, currentPlan } = response.data;
      console.log('canUse', canUse, 'needPayment', needPayment, 'currentPlan', currentPlan);
      if (canUse) {
        handleSubmit();
      } else {
        // 显示支付选择弹窗
        const paymentOptions = [
          {
            amount: 19.9,
            // amount: 0.01,
            title: '体验版 19.9元 100次完整体验gpt4o生图功能',
            type: 'gpt4_drawing',
            subType: 'basic',
            features: [
            '使用gPT4o绘画',
            '50次生图',
            '可以修改内容',
            '支持商用'
            ]
          },
          {
            amount: 199,
            title: '包年版 超值优惠 不限次数生成图片',
            type: 'gpt4_drawing',
            subType: 'premium',
            features: [
            '使用gPT4o绘画',
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

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      message.warning('请输入提示词');
      return;
    }

    setCurrentPrompt(prompt.trim());
    setLoading(true);

    let currentConversationId = selectedConversation;

    // 如果没有选中的对话，创建新对话
    if (!currentConversationId) {
      try {
        const response = await axios.post('/api/image-gen', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations([response.data, ...conversations]);
        setSelectedConversation(response.data._id);
        currentConversationId = response.data._id;
      } catch (error) {
        message.error('创建对话失败');
        setLoading(false);
        setCurrentPrompt('');
        return;
      }
    }

    const imageObj = {
      prompt,
      type: imageFile ? 'img2img' : 'text2img',
      sourceImage: imagePreview
    };
    setConversations(prevConversations => {
      return prevConversations.map((conv, index) => {
        if (conv._id === currentConversationId) {
          setImageIndex(conv.images.length);
          return {
            ...conv,
            images: [...conv.images, imageObj]
          };
        }
        return conv;
      });
    });

    try {
      // 创建 FormData 对象并添加数据
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('type', imageFile ? 'img2img' : 'text2img');
      if (imageFile) {
        formData.append('sourceImage', imageFile);
      }

      // 检查 FormData 内容
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      // 发送请求时不要将 Content-Type 设置为 multipart/form-data，
      // 让浏览器自动设置正确的 boundary
      const response = await axios.post(
        `/api/image-gen/${currentConversationId}/generate`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      // 更新对话列表中的图片
      setConversations(prevConversations => {
        return prevConversations.map(conv => {
          if (conv._id === currentConversationId) {
            return {
              ...conv,
              images: [...conv.images.slice(0, conv.images.length - 1), {
                ...imageObj,
                ...response.data
              }]
            };
          }
          return conv;
        });
      });
      setPrompt('');
      handleRemoveImage();
    } catch (error: any) {
      console.error('生成图片失败:', error.response?.data || error.message);
      message.error('生成图片失败');
    } finally {
      setLoading(false);
      setCurrentPrompt('');
      setImageIndex(-1);
    }
  };

  const currentConversation = conversations.find(conv => conv._id === selectedConversation);
  const isEmpty = !selectedConversation && !loading;

  // 自动滚动到底部，确保在DOM更新后执行滚动
  useEffect(() => {
    // 使用setTimeout确保在浏览器完成渲染后执行
    const timer = setTimeout(() => {
      if (contentAreaRef.current) {
        // 直接设置scrollTop，设置一个非常大的值（如1e10），浏览器会自动修正为最大可滚动值
        contentAreaRef.current.scrollTop = 1e10; // 10,000,000,000
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [conversations]);

  return (
    <>
      <PageTitle title="超级个体super-i gpt40绘图在线体验" />
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <StyledLayout>
          <HomeButton
            onClick={() => window.location.href = 'https://www.super-i.cn/'}
          >
            回到super-i首页
          </HomeButton>
          <ButtonGroup>
            <Button
              onClick={() => navigate('/text-chat')}
            >
              跳转到策略生成工具
            </Button>
            <Button
              onClick={() => {
                message.success('收藏成功！');
              }}
            >
              收藏工具❤
            </Button>
          </ButtonGroup>
          {/* <ConversationList
            conversations={conversations}
            selectedId={selectedConversation}
            onSelect={setSelectedConversation}
          /> */}
          <MainContent>
            <ContentArea $isEmpty={isEmpty} ref={contentAreaRef}>
              {isEmpty ? (
                <div style={{ position: 'relative' }}>
                  <EmptyState />
                  <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                    <div style={{ position: 'relative', margin: '0 auto', maxWidth: '1000px', borderRadius: '8px', overflow: 'hidden' }}>
                      <StyledTextArea
                        style={{ backgroundColor: '#ffffff', color: '#000000', paddingTop: imagePreview ? 72 : undefined }}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="请描述您要生成的图片"
                        autoSize={{ minRows: 6, maxRows: 10 }}
                      />
                      {imagePreview && (
                        <div style={{ position: 'absolute', top: 8, left: 8, width: 56, height: 56, zIndex: 2 }}>
                          <img src={imagePreview} alt="缩略图" style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                          <Button
                            size="small"
                            shape="circle"
                            icon={<CloseCircleFilled style={{ color: '#f5222d', fontSize: 16 }} />}
                            style={{ position: 'absolute', top: -10, right: -10, zIndex: 3, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                            onClick={handleRemoveImage}
                          />
                        </div>
                      )}
                    </div>
                    <StyledUpload
                      name="image"
                      showUploadList={false}
                      customRequest={({ file, onSuccess }: any) => {
                        onSuccess();
                      }}
                      onChange={handleImageUpload}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />} disabled={!!imageFile || uploading} />
                    </StyledUpload>
                  </ConfigProvider>
                  <SendButton style={{ position: 'absolute', left: '15px', bottom: '15px', rotate: '0deg', padding: '8px 16px' }}>
                    <ModelIcon src="../../../imgs/gpt-icon.png" />GPT-4o
                  </SendButton>
                  <SendButton
                    shape="circle"
                    icon={<ArrowUpOutlined />}
                    onClick={beforeSubmit}
                    disabled={loading || uploading || !prompt.trim()}
                    type="primary"
                    style={{ position: 'absolute', right: '15px', bottom: '15px' }}
                  />
                </div>
              ) : (
                <ImageDisplay 
                  conversation={currentConversation} 
                  isGenerating={loading}
                  currentPrompt={currentPrompt}
                  imageIndex={imageIndex}
                />
              )}
            </ContentArea>
            {!isEmpty && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '1000px' }}>
                  <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                    <div style={{ position: 'relative', margin: '0 auto', maxWidth: '1000px' }}>
                      <StyledTextArea
                        style={{ backgroundColor: '#ffffff', color: '#000000', paddingTop: imagePreview ? 72 : undefined }}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="请描述您要生成的图片"
                        autoSize={{ minRows: 6, maxRows: 10 }}
                      />
                      {imagePreview && (
                        <div style={{ position: 'absolute', top: 8, left: 8, width: 56, height: 56, zIndex: 2 }}>
                          <img src={imagePreview} alt="缩略图" style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
                          <Button
                            size="small"
                            shape="circle"
                            icon={<CloseCircleFilled style={{ color: '#f5222d', fontSize: 16 }} />}
                            style={{ position: 'absolute', top: -10, right: -10, zIndex: 3, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                            onClick={handleRemoveImage}
                          />
                        </div>
                      )}
                    </div>
                    <StyledUpload
                      name="image"
                      showUploadList={false}
                      customRequest={({ file, onSuccess }: any) => {
                        onSuccess();
                      }}
                      onChange={handleImageUpload}
                      accept="image/*"
                    >
                      <Button icon={<UploadOutlined />} disabled={!!imageFile || uploading} />
                    </StyledUpload>
                  </ConfigProvider>
                  <SendButton style={{ position: 'absolute', left: '15px', bottom: '15px', rotate: '0deg', padding: '8px 16px' }}>
                    <ModelIcon src="../../../imgs/gpt-icon.png" />GPT-4o
                  </SendButton>
                  <SendButton
                    shape="circle"
                    icon={<ArrowUpOutlined />}
                    onClick={beforeSubmit}
                    disabled={loading || uploading || !prompt.trim()}
                    type="primary"
                    style={{ position: 'absolute', right: '15px', bottom: '15px' }}
                  />
                </div>
              </div>
            )}
          </MainContent>
          <PaymentModal
            visible={paymentModalVisible}
            onClose={() => setPaymentModalVisible(false)}
            paymentOptions={paymentOptions}
            currentPlan={currentPlan}
            callback={() => {
              setPaymentModalVisible(false);
              handleSubmit();
            }}
          />
        </StyledLayout>
      </ConfigProvider>
    </>
  );
};

export default ImageGen; 