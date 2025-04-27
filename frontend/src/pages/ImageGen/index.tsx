import React, { useState, useEffect } from 'react';
import { Layout, Input, Button, Upload, message, Spin } from 'antd';
import { UploadOutlined, SendOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import axios from 'axios';
import { useAppSelector } from '../../store/hooks';
import ConversationList from './components/ConversationList';
import ImageDisplay from './components/ImageDisplay';
import EmptyState from './components/EmptyState';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  height: 100vh;
  background: #000000;
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
  background: #000000;
`;

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: ${props => props.$isEmpty ? 'center' : 'flex-start'};
  padding: 0 20px;
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
  border-radius: 4px;
  
  &:hover, &:focus {
    border-color: #666;
  }

  .ant-input {
    background: #1a1a1a;
    color: #fff;
  }
`;

const StyledUpload = styled(Upload)`
  .ant-upload-list {
    display: none;
  }

  .ant-btn {
    background: transparent;
    border: 1px solid #333;
    color: #fff;
    
    &:hover {
      border-color: #666;
      color: #fff;
    }
  }
`;

const SendButton = styled(Button)`
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
  height: 40px;
  width: 40px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover, &:focus {
    background: #333;
    border-color: #666;
    color: #fff;
  }

  &:disabled {
    background: #1a1a1a;
    border-color: #333;
    color: #666;
  }
`;

interface Conversation {
  id: string;
  prompt: string;
  imageUrl?: string;
  createdAt: Date;
}

const ImageGen: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/api/conversations/images', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      message.error('获取对话记录失败');
    }
  };

  const handleImageUpload = (info: any) => {
    if (info.file.status === 'done') {
      setImageFile(info.file.originFileObj);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && !imageFile) {
      message.warning('请输入提示词或上传图片');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.post('/api/images/generate', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const newConversation: Conversation = {
        id: response.data.id,
        prompt,
        imageUrl: response.data.imageUrl,
        createdAt: new Date()
      };

      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation.id);
      setPrompt('');
      setImageFile(null);
    } catch (error) {
      message.error('生成图片失败');
    } finally {
      setLoading(false);
    }
  };

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);
  const isEmpty = conversations.length === 0;

  return (
    <StyledLayout>
      <ConversationList
        conversations={conversations}
        selectedId={selectedConversation}
        onSelect={setSelectedConversation}
      />
      <MainContent>
        <ContentArea $isEmpty={isEmpty}>
          {loading ? (
            <Spin size="large" />
          ) : isEmpty ? (
            <EmptyState />
          ) : (
            <ImageDisplay conversation={currentConversation} />
          )}
        </ContentArea>
        <InputArea>
          <StyledUpload
            name="image"
            showUploadList={false}
            customRequest={({ file, onSuccess }: any) => {
              onSuccess();
            }}
            onChange={handleImageUpload}
          >
            <Button icon={<UploadOutlined />} />
          </StyledUpload>
          <StyledTextArea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="请描述您想要生成的图片..."
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
          <SendButton
            icon={<SendOutlined />}
            onClick={handleSubmit}
            disabled={loading || (!prompt.trim() && !imageFile)}
          />
        </InputArea>
      </MainContent>
    </StyledLayout>
  );
};

export default ImageGen; 