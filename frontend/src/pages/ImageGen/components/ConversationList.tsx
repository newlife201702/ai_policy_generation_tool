import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const { Text } = Typography;

const Container = styled.div`
  width: 260px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  height: 100vh;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #333;
  }
`;

const Header = styled.div`
  padding: 20px;
  border-bottom: 1px solid #333;
  
  h2 {
    color: #fff;
    margin: 0;
    font-size: 16px;
  }
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;

  @media (max-width: 768px) {
    max-height: 200px;
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

interface Conversation {
  id: string;
  prompt: string;
  imageUrl?: string;
  createdAt: Date;
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
  return (
    <Container>
      <Header>
        <h2>GPT-4o生图</h2>
      </Header>
      <List>
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            $selected={selectedId === conversation.id}
            onClick={() => onSelect(conversation.id)}
          >
            <ItemTitle>{conversation.prompt}</ItemTitle>
            <ItemDate>
              {format(new Date(conversation.createdAt), 'MM月dd日 HH:mm', { locale: zhCN })}
            </ItemDate>
          </ConversationItem>
        ))}
      </List>
    </Container>
  );
};

export default ConversationList; 