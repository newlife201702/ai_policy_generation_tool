import React from 'react';
import styled, { keyframes } from 'styled-components';
import { DownloadOutlined } from '@ant-design/icons';
import { Reveal } from 'react-awesome-reveal';
import { keyframes as emotionKeyframes } from '@emotion/react';
import { Image as AntdImage } from 'antd';

const Container = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 110px auto 0px;
  padding: 20px;

  @media (max-width: 768px) {
    // margin: 0px auto 0px;
  }
`;

const MessageGroup = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const UserMessage = styled.div`
  align-self: flex-end;
  max-width: 80%;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CreateImageText = styled.span`
  color: #1677ff;
  font-size: 14px;
`;

const UserPrompt = styled.span`
  color: #fff;
  font-size: 14px;
`;

const AIMessage = styled.div`
  align-self: flex-start;
  max-width: 400px;
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const ProcessingText = styled.div`
  color: #fff;
  font-size: 14px;
  background: linear-gradient(90deg, #333 0%, #444 50%, #333 100%);
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
`;

const ImageWrapper = styled.div`
  position: relative;
  margin-top: 12px;
  background: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  width: fit-content;
  
  &:hover .download-icon {
    opacity: 1;
  }
`;

const StyledImage = styled.img`
  max-width: 100%;
  height: auto;
  display: block;
`;

const DownloadButton = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  color: white;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`;

const SourceImageWrapper = styled.div`
  position: relative;
  margin-bottom: 4px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 200px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: none;
`;

const SourceStyledImage = styled(AntdImage)`
  max-width: 100%;
  border-radius: 6px;
  object-fit: cover;
`;

const SmallImageWrapper = styled(ImageWrapper)`
  margin-top: 8px;
`;

const SmallStyledImage = styled(AntdImage)`
  max-width: 100%;
  border-radius: 10px;
`;

const BlurMask = styled.div<{ $img: string }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  // background: ${({ $img }) => `url('${$img}')`};
  background: url('../../../../imgs/mohu.png');
  background-size: cover;
  background-position: center;
`;

const blurReveal = emotionKeyframes`
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(100%);
  }
`;

const ShineText = styled.div`
  position: relative;
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: #222;
  background: linear-gradient(110deg, #222 20%, #fff 40%, #fff 60%, #222 80%);
  background-size: 200% 100%;
  background-position: 200% 0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine-move 2.2s linear infinite;

  @keyframes shine-move {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
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
  isGenerating?: boolean;
  currentPrompt?: string;
  imageIndex?: number;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
  conversation, 
  isGenerating,
  currentPrompt,
  imageIndex 
}) => {
  // 控制每张图片的可见性，初始为false，动画开始时设为true
  const [imgVisible, setImgVisible] = React.useState<{ [idx: number]: boolean }>({});

  if (!conversation && !currentPrompt) {
    return null;
  }

  const handleDownload = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${prompt.slice(0, 30)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('下载图片失败:', error);
    }
  };

  return (
    <Container>
      {/* 显示历史消息 */}
      {conversation?.images.map((img, idx) => (
        <MessageGroup key={`history-${idx}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {img.sourceImage && (
              <SourceImageWrapper>
                <SourceStyledImage src={img.sourceImage} alt="Source" preview={true} />
              </SourceImageWrapper>
            )}
            <UserMessage>
              <CreateImageText>创建图片</CreateImageText>
              <UserPrompt>{img.prompt}</UserPrompt>
            </UserMessage>
          </div>
          {isGenerating && currentPrompt && imageIndex === idx ? (
            <AIMessage>
              <ShineText>正在创建图片</ShineText>
              <SmallImageWrapper style={{ position: 'relative' }}>
                <SmallStyledImage
                  src="../../../../imgs/empty-img.png"
                  key={`empty-img-${idx}`}
                />
              </SmallImageWrapper>
            </AIMessage>
          ) : (
            img.url ? (
              <AIMessage>
                <UserPrompt>图片已创建</UserPrompt>
                <SmallImageWrapper style={{ position: 'relative' }}>
                  <SmallStyledImage
                    src={img.url}
                    alt={img.prompt}
                    preview={true}
                    // style={{ visibility: imgVisible[idx] ? 'visible' : 'hidden' }}
                    key={`img-${idx}`}
                  />
                  {/* <Reveal
                    keyframes={blurReveal}
                    duration={3000}
                    triggerOnce
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    onVisibilityChange={v => {
                      if (v && !imgVisible[idx]) {
                        setTimeout(() => {
                          setImgVisible(s => ({ ...s, [idx]: true }));
                        }, 500);
                      }
                    }}
                  >
                    <BlurMask $img={img.url} />
                  </Reveal> */}
                  <DownloadButton
                    className="download-icon"
                    onClick={() => handleDownload(img.url, img.prompt)}
                  >
                    <DownloadOutlined />
                  </DownloadButton>
                </SmallImageWrapper>
              </AIMessage>
            ) : (
              <AIMessage>
                <UserPrompt>生成图片失败</UserPrompt>
              </AIMessage>
            )
          )}
        </MessageGroup>
      ))}

      {/* 显示当前正在生成的消息 */}
      {/* {isGenerating && currentPrompt && (
        <MessageGroup key="generating">
          <UserMessage>
            <CreateImageText>创建图片</CreateImageText>
            <UserPrompt>{currentPrompt}</UserPrompt>
          </UserMessage>

          <AIMessage>
            <ShineText>正在创建图片</ShineText>
            <SmallImageWrapper style={{ position: 'relative' }}>
              <SmallStyledImage
                src="../../../../imgs/empty-img.png"
              />
            </SmallImageWrapper>
          </AIMessage>
        </MessageGroup>
      )} */}
    </Container>
  );
};

export default ImageDisplay; 