import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Layout, Input, Button, Radio, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { RootState } from '@/store';
import {
  addConversation,
  addImage,
  setLoading,
  setError,
} from '@/store/slices/imageGenSlice';
import { v4 as uuidv4 } from 'uuid';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;

const StyledLayout = styled(Layout)`
  height: 100vh;
`;

const StyledHeader = styled(Header)`
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const StyledSider = styled(Sider)`
  background: #fff;
  border-right: 1px solid #f0f0f0;
`;

const StyledContent = styled(Content)`
  background: #fff;
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

const InputContainer = styled.div`
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
`;

const ImagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const ImageCard = styled.div`
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .info {
    padding: 12px;
    
    p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }
  }
`;

const ImageGen: React.FC = () => {
  const dispatch = useDispatch();
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'text2img' | 'img2img'>('text2img');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const { conversations, currentConversationId, isLoading } = useSelector(
    (state: RootState) => state.imageGen
  );

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  useEffect(() => {
    if (!currentConversationId) {
      const newConversation = {
        id: uuidv4(),
        images: [],
        title: '新图片对话',
        createdAt: Date.now(),
      };
      dispatch(addConversation(newConversation));
    }
  }, [currentConversationId, dispatch]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !currentConversationId) return;
    if (type === 'img2img' && !sourceImage) {
      message.error('请上传参考图片');
      return;
    }

    try {
      dispatch(setLoading(true));
      // TODO: 调用后端API生成图片
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: uuidv4(),
            prompt: prompt.trim(),
            url: 'https://via.placeholder.com/400',
            timestamp: Date.now(),
            model: 'GPT-4o',
            type,
            sourceImage: type === 'img2img' ? sourceImage : undefined,
          });
        }, 1000);
      });

      dispatch(
        addImage({
          conversationId: currentConversationId,
          image: response as any,
        })
      );
      setPrompt('');
      if (type === 'img2img') {
        setSourceImage(null);
      }
    } catch (error) {
      console.error('生成图片失败:', error);
      dispatch(setError('生成图片失败，请重试'));
      message.error('生成图片失败，请重试');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <StyledLayout>
      <StyledHeader>
        <Radio.Group value={type} onChange={(e) => setType(e.target.value)}>
          <Radio.Button value="text2img">文生图</Radio.Button>
          <Radio.Button value="img2img">图生图</Radio.Button>
        </Radio.Group>
      </StyledHeader>
      <Layout>
        <StyledSider width={300}>
          {/* TODO: 添加对话列表 */}
        </StyledSider>
        <StyledContent>
          <InputContainer>
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入图片描述"
              autoSize={{ minRows: 3, maxRows: 6 }}
              style={{ marginBottom: 16 }}
              disabled={isLoading}
            />
            {type === 'img2img' && (
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUpload}
                disabled={isLoading}
              >
                <Button icon={<UploadOutlined />} style={{ marginBottom: 16 }}>
                  {sourceImage ? '重新上传参考图片' : '上传参考图片'}
                </Button>
              </Upload>
            )}
            {sourceImage && (
              <img
                src={sourceImage}
                alt="参考图片"
                style={{ maxWidth: '200px', marginBottom: 16 }}
              />
            )}
            <Button
              type="primary"
              onClick={handleGenerate}
              loading={isLoading}
              disabled={!prompt.trim()}
              block
            >
              生成图片
            </Button>
          </InputContainer>
          <ImagesContainer>
            {currentConversation?.images.map((img) => (
              <ImageCard key={img.id}>
                <img src={img.url} alt={img.prompt} />
                <div className="info">
                  <p>{img.prompt}</p>
                  <p>{new Date(img.timestamp).toLocaleString()}</p>
                </div>
              </ImageCard>
            ))}
          </ImagesContainer>
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default ImageGen; 