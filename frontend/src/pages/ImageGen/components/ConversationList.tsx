import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Typography, Button } from 'antd';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const { Text } = Typography;

const Container = styled.div<{ $isExpanded: boolean }>`
  width: 260px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    left: ${props => props.$isExpanded ? '0' : '-260px'};
    top: 0;
    bottom: 0;
    z-index: 1000;
    width: 260px;
    height: 100vh;
    border-right: 1px solid #333;
    box-shadow: ${props => props.$isExpanded ? '2px 0 8px rgba(0,0,0,0.15)' : 'none'};
  }
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    color: #fff;
    margin: 0;
    font-size: 16px;
  }
`;

const ToggleButton = styled(Button)`
  display: none;
  position: fixed;
  left: 10px;
  top: 10px;
  z-index: 1001;
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;

  @media (max-width: 768px) {
    display: block;
  }

  &:hover {
    background: #333 !important;
    border-color: #444 !important;
    color: #fff !important;
  }
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;

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

const ConversationItem = styled.div<{ $selected: boolean }>`
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  background: ${props => props.$selected ? '#333' : 'transparent'};
  transition: all 0.3s;

  &:hover {
    background: ${props => props.$selected ? '#333' : '#222'};
  }
`;

const ItemTitle = styled(Text)`
  display: block;
  color: #fff !important;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemDate = styled(Text)`
  color: #666 !important;
  font-size: 12px;
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

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <ToggleButton
        icon={isExpanded ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
        onClick={toggleExpand}
      />
      <Container $isExpanded={isExpanded}>
        <Header>
          <h2>GPT-4o生图</h2>
        </Header>
        <List>
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation._id}
              $selected={selectedId === conversation._id}
              onClick={() => {
                onSelect(conversation._id);
                if (isMobile) {
                  setIsExpanded(false);
                }
              }}
            >
              <ItemTitle>
                {conversation.images.length > 0
                  ? conversation.images[conversation.images.length - 1].prompt
                  : conversation.title}
              </ItemTitle>
              <ItemDate>
                {format(new Date(conversation.createdAt), 'MM月dd日 HH:mm', { locale: zhCN })}
              </ItemDate>
            </ConversationItem>
          ))}
        </List>
      </Container>
    </>
  );
};

export default ConversationList; 