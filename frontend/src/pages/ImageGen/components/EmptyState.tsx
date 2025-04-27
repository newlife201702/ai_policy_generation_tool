import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const Container = styled.div`
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const StyledTitle = styled(Title)`
  color: #fff !important;
  margin-bottom: 16px !important;
`;

const Description = styled(Text)`
  color: #999 !important;
  font-size: 16px;
  display: block;
  margin-bottom: 32px;
`;

const EmptyState: React.FC = () => {
  return (
    <Container>
      <StyledTitle level={2}>低成本体验GPT4o生图功能</StyledTitle>
      <Description>
        请描述您想要生成的图片，或者上传一张图片进行修改
      </Description>
    </Container>
  );
};

export default EmptyState; 