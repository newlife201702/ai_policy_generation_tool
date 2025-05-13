import React from 'react';
import styled from 'styled-components';
import { Typography } from 'antd';

const { Title, Text } = Typography;

const Container = styled.div`
  text-align: center;
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const StyledTitle = styled(Title)`
  color: #fff !important;
  margin-bottom: 20px !important;
  font-size: 33px !important;
  font-weight: 400 !important;
`;

const Description = styled(Text)`
  max-width: 80%;
  color: #fff !important;
  font-size: 14px;
  display: block;
  margin: 0px auto;
`;

const EmptyState: React.FC = () => {
  return (
    <Container>
      <StyledTitle level={2}>最新绘图大模型 GPT-4o Image plus版 在线体验</StyledTitle>
      {/* <Description>
        在这个竞争激烈的市场环境中，拥有一份清晰、精准的品牌策略至关重要。然而，制定品牌策略往往是一个复杂且耗时的过程。现在，我们为您提供一种全新的解决方案——一键生成品牌策略，快速、高效地帮助您的品牌脱颖而出。
      </Description> */}
    </Container>
  );
};

export default EmptyState; 