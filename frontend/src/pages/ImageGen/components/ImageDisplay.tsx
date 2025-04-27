import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';

const { Text } = Typography;

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const ImageWrapper = styled.div`
  margin-bottom: 20px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  
  img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

const PromptText = styled(Text)`
  display: block;
  color: #fff !important;
  font-size: 14px;
  margin-bottom: 20px;
  text-align: center;
`;

interface Conversation {
  id: string;
  prompt: string;
  imageUrl?: string;
  createdAt: Date;
}

interface ImageDisplayProps {
  conversation?: Conversation;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ conversation }) => {
  if (!conversation) {
    return null;
  }

  return (
    <Container>
      <PromptText>{conversation.prompt}</PromptText>
      {conversation.imageUrl && (
        <ImageWrapper>
          <img src={conversation.imageUrl} alt={conversation.prompt} />
        </ImageWrapper>
      )}
    </Container>
  );
};

export default ImageDisplay; 