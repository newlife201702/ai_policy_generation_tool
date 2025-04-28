import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';

const { Text } = Typography;

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  overflow-y: auto;

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

interface ImageDisplayProps {
  conversation?: Conversation;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ conversation }) => {
  if (!conversation || !conversation.images.length) {
    return null;
  }

  return (
    <Container>
      {conversation.images.map((img, idx) => (
        <div key={idx}>
          <PromptText>{img.prompt}</PromptText>
          <ImageWrapper>
            <img src={img.url} alt={img.prompt} />
          </ImageWrapper>
          {img.sourceImage && (
            <div>
              <PromptText>原始图片：</PromptText>
              <ImageWrapper>
                <img src={img.sourceImage} alt="Source" />
              </ImageWrapper>
            </div>
          )}
        </div>
      ))}
    </Container>
  );
};

export default ImageDisplay; 