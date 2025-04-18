import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Input, Button, message as antMessage, Spin } from 'antd';
import {
  SendOutlined,
  ReloadOutlined,
  CopyOutlined,
  PlusCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import { Message } from '../../types/chat';
import {
  ReactFlow,
  Node,
  Edge,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// 定义扩展的消息类型
interface ExtendedMessage extends Message {
  isStreaming?: boolean;
  error?: boolean;
  parentId?: string;
  hidden?: boolean;
}

const { TextArea } = Input;

const Container = styled.div`
  margin-top: 56px;
  height: calc(100vh - 56px);
  background-color: black;
  color: white;
  position: relative;
`;

const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ChatWrapper = styled.div`
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const UserInputSection = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;
`;

const UserInputBox = styled.div`
  width: 48%;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  position: relative;
`;

const UserInputContent = styled.div`
  white-space: pre-wrap;
  margin-bottom: 15px;
  color: white;
  font-size: 14px;
  line-height: 1.6;
`;

const UserInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserAvatar = styled.div`
  display: flex;
  align-items: center;
`;

const Avatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
`;

const ResponseSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  position: relative;
  z-index: 1;
`;

const FlowContainer = styled.div`
  width: 100%;
  height: calc(100vh - 128px);
`;

const ResponseBox = styled.div`
  max-width: 200px;
  min-width: 200px;
  background-color: #434343;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  position: relative;
  font-size: 12px;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ResponseContent = styled.div`
  margin-bottom: 15px;
`;

const ModelInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModelAvatar = styled.div`
  display: flex;
  align-items: center;
`;

const ModelIcon = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 8px;
`;

const TimeInfo = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`;

const MessageContainer = styled.div`
  position: relative;
`;

const UserMessage = styled.div`
  background-color: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
  white-space: pre-wrap;
`;

const BotMessage = styled.div`
  position: relative;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 10px;
  border-left: 3px solid #1890ff;
  
  &:hover .message-actions {
    opacity: 1;
  }
`;

const MessageActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.2s;
`;

const ActionButton = styled(Button)`
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  height: 72px;
`;

const StyledTextArea = styled(TextArea)`
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  resize: none;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SendButton = styled(Button)`
  margin-left: 10px;
  background-color: #1890ff;
  color: white;
  height: auto;
  
  &:hover {
    background-color: #40a9ff;
    color: white;
  }
  
  &[disabled] {
    background-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
  }
`;

const NewChatButton = styled(Button)`
  position: absolute;
  bottom: 72px;
  left: calc(50% - 76px);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  width: 152px;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    border-color: rgba(255, 255, 255, 0.3);
  }
`;

const MarkdownStyles = styled.div`
  color: white;
  font-size: 12px;
  line-height: 1.6;
  
  h1, h2, h3, h4, h5, h6 {
    color: white;
    margin-top: 16px;
    margin-bottom: 8px;
  }
  
  ul, ol {
    padding-left: 20px;
  }
  
  a {
    color: #1890ff;
  }
  
  p {
    margin-bottom: 12px;
  }
  
  code {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 2px 4px;
    border-radius: 4px;
  }
  
  pre {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
  }
`;

interface ChatContentProps {
  messages: ExtendedMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onRegenerateMessage: (message: ExtendedMessage) => Promise<void>;
  loading: boolean;
  onNewChat: () => void;
  onSelectMessage: (messageId: string) => void;
  selectedMessageId: string | null;
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  onSendMessage,
  onRegenerateMessage,
  loading,
  onNewChat,
  onSelectMessage,
  selectedMessageId
}) => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [inputValue, setInputValue] = useState('');
  const chatAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 滚动到底部
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
    renderFlowithStyle();
  }, [messages]);
  
  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    onSendMessage(inputValue);
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content).then(
      () => {
        antMessage.success('已复制到剪贴板');
      },
      () => {
        antMessage.error('复制失败');
      }
    );
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    
    if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    if (date.getFullYear() === now.getFullYear()) {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  const renderFlowithStyle = () => {
    
    // 找到用户消息和助手消息
    const userMessages = messages.filter(msg => msg.role === 'user' && !msg.hidden);
    const assistantMessages = messages.filter(msg => !msg.hidden);
    
    if (userMessages.length === 0 || assistantMessages.length === 0) return null;
    
    // 解析第一个用户消息的内容，分割出公司介绍和品牌目标
    const firstUserMessage = userMessages[0];
    const content = firstUserMessage.content;
    const companyInfoMatch = content.match(/公司信息: (.*?)(?=\n|$)/);
    const brandGoalMatch = content.match(/品牌宣传的目的: (.*?)(?=\n|$)/);
    
    const companyInfo = companyInfoMatch ? companyInfoMatch[1] : "";
    const brandGoal = brandGoalMatch ? brandGoalMatch[1] : "";
    
    // 将消息转换为节点
    const newNodes: Node[] = [
      {
        id: '0',
        role: 'user',
        content: companyInfo,
        timestamp: firstUserMessage.timestamp
      },
      {
        id: '1',
        role: 'user',
        content: brandGoal,
        timestamp: firstUserMessage.timestamp
      }
    ].concat(assistantMessages.slice(1)).map((message, index) => {
      let x = 0;
      let y = 0;
      // 节点宽度和间距
      const nodeWidth = 200;
      const gap = 100; // 节点之间的间距
      const gapY = 100; // 节点之间的间距
      // 获取视口尺寸（这里容器占满整个视口）
      const viewportWidth = window.innerWidth;
      // 计算中心点
      const centerX = viewportWidth / 2;
      if (index < 2) {
        // 计算两个节点的总宽度（包括间距）
        const totalWidth = nodeWidth * 2 + gap * 1;
        // 计算节点位置
        const leftNodeX = centerX - totalWidth / 2;
        x = leftNodeX + index * (nodeWidth + gap);
        y = 100;
      } else if (index < 7) {
        if (message.parentId) {
          const parentNode = nodes.find(item => item.id === message.parentId);
          const nodeElement0 = document.querySelector(`[data-id="0"]`);
          const nodeHeight0 = nodeElement0?.offsetHeight || 0;
          const nodeElement1 = document.querySelector(`[data-id="1"]`);
          const nodeHeight1 = nodeElement1?.offsetHeight || 0;
          // 计算五个节点的总宽度（包括间距）
          const totalWidth = nodeWidth * 5 + gap * 4;
          // 计算节点位置
          const leftNodeX = centerX - totalWidth / 2;
          x = leftNodeX + (index - 2) * (nodeWidth + gap);
          y = parentNode.position.y + Math.max(nodeHeight0, nodeHeight1) + gapY;
        }
      } else {
        if (message.parentId) {
          const parentNode = nodes.find(item => item.id === message.parentId);
          const nodeElement = document.querySelector(`[data-id="${parentNode.id}"]`);
          const nodeHeight = nodeElement?.offsetHeight || 0;
          x = parentNode.position.x;
          y = parentNode.position.y +nodeHeight + gapY;
        }
      }
      return {
        id: message.id,
        type: 'custom',
        data: message,
        position: { x, y }
      };
    });
    setNodes(newNodes);
  
    // 创建边
    const newEdges: Edge[] = assistantMessages
      .concat(assistantMessages.filter(item => item.parentId === '0')
        .map(message => ({
          ...message,
          parentId: '1'
        }))
      )
      .filter(message => message.parentId)
      .map(message => ({
        id: `${message.parentId}-${message.id}`,
        source: message.parentId,
        target: message.id,
        type: 'smoothstep',
      }));
      setEdges(newEdges);
  };
  
  // 修改renderTraditionalChat函数
  const renderTraditionalChat = () => {
    return (
      <>
        {messages.map((msg, index) => renderMessage(msg, index))}
        
        {/* 只在没有显示流式消息时显示加载状态 */}
        {loading && !messages.some(msg => msg.isStreaming) && (
          <MessageContainer>
            <BotMessage>
              <Spin /> 正在生成...
            </BotMessage>
          </MessageContainer>
        )}
      </>
    );
  };
  
  // 修改renderMessage函数
  const renderMessage = (message: ExtendedMessage) => {
    // 如果消息被标记为隐藏，则不渲染
    if (message.hidden) return null;
    
    const isSelected = message.id === selectedMessageId;
    
    if (message.role === 'user') {
      return (
        <MessageWrapper 
          key={message.id}
          isUser={true}
          isSelected={false}
        >
          <MessageContent>
            <MarkdownStyles>{message.content}</MarkdownStyles>
          </MessageContent>
        </MessageWrapper>
      );
    }
    
    return (
      <MessageWrapper 
        key={message.id}
        isUser={false}
        isSelected={isSelected}
        onClick={() => onSelectMessage(message.id)}
      >
        <MessageContent>
          <MarkdownStyles>{message.content}</MarkdownStyles>
          <MessageActions>
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                onRegenerateMessage(message);
              }}
            />
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(message.content);
                antMessage.success('已复制到剪贴板');
              }}
            />
          </MessageActions>
        </MessageContent>
      </MessageWrapper>
    );
  };
  
  // 添加选中的样式
  const MessageWrapper = styled.div<{ isUser: boolean; isSelected: boolean }>`
    display: flex;
    justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
    margin: 8px 0;
    padding: 8px;
    border-radius: 8px;
    background-color: ${props => props.isSelected ? '#e6f7ff' : 'transparent'};
    border: ${props => props.isSelected ? '1px solid #1890ff' : 'none'};
    cursor: ${props => !props.isUser ? 'pointer' : 'default'};
    
    &:hover {
      background-color: ${props => !props.isUser ? '#f5f5f5' : 'transparent'};
    }
  `;

  const MessageContent = styled.div`
    display: flex;
    flex-direction: column;
  `;

  const StyledMarkdown = styled(ReactMarkdown)`
    white-space: pre-wrap;
    margin-bottom: 15px;
    color: white;
    font-size: 14px;
    line-height: 1.6;
  `;

  const CustomNode = useCallback(({ data: message, isConnectable }) => {
    return (
      <ResponseBox key={message.id}>
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
        />
        <ResponseContent>
          {message.isStreaming ? (
            <MarkdownStyles>
              {message.content}
            </MarkdownStyles>
          ) : (
            <MarkdownStyles>{renderMessage(message)}</MarkdownStyles>
          )}
        </ResponseContent>
        <ModelInfo>
          <ModelAvatar>
            <ModelIcon src="/gpt-icon.png" />
            <span>GPT-4o mini</span>
          </ModelAvatar>
          <TimeInfo>{formatTime(message.timestamp)}</TimeInfo>
        </ModelInfo>
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
        />
      </ResponseBox>
    );
  }, []);
  
  // 然后在节点定义中使用 type: 'custom'
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  return (
    <Container>
      {/* {messages.length >= 2 ? renderFlowithStyle() : renderTraditionalChat()} */}
      <FlowContainer>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          zoomOnScroll={false}
          preventScrolling={false}
          panOnScroll={true}
          panOnScrollMode="vertical"
        >
        </ReactFlow>
      </FlowContainer>
  
      <NewChatButton
        icon={<PlusCircleOutlined />}
        onClick={onNewChat}
        size="large"
      >
        生成新的内容
      </NewChatButton>
      
      <InputContainer>
        <StyledTextArea
          placeholder="继续输入问题..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <SendButton
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!inputValue.trim() || loading}
        />
      </InputContainer>
    </Container>
  );
};

export default ChatContent; 