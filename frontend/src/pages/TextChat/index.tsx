import React, { useState, useEffect, useRef } from 'react';
import { message, Select, List, Avatar, Button, Input, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { api, fetchStreamResponse } from '../../utils/api';
import { Message, ChatRequest, ChatResponse, HistoryItem, ChatModel } from '../../types/chat';
import InitialChat from './InitialChat';
import ChatContent from './ChatContent';
import { v4 as uuidv4 } from 'uuid';
import chatApi from '../../services/chatApi';
import { SendOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { throttle } from 'lodash';

// 添加所有缺失的样式组件
const ChatContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const ChatPanel = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
`;

const ChatHeader = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  width: 100%;
  height: 56px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e8e8e8;
`;

const ChatInput = styled(Input)`
  flex: 1;
  margin-right: 12px;
`;

const SendButton = styled(Button)`
  min-width: 40px;
`;

const HistorySidebar = styled.div`
  width: 280px;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
`;

const StyledListItem = styled(List.Item)`
  padding: 12px 16px;
  cursor: pointer;
  &:hover {
    background-color: #f5f5f5;
  }
`;

const StyledListItemMeta = styled(List.Item.Meta)`
  flex: 1;
`;

// 修改本地历史记录项类型定义
interface LocalHistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  model?: string;
}

// 定义扩展的消息类型以包含isStreaming属性
interface ExtendedMessage extends Omit<Message, 'role'> {
  role: 'user' | 'assistant' | 'bot';
  type?: 'user' | 'assistant' | 'bot';
  isStreaming?: boolean;
  error?: boolean;
  parentId?: string;
  hidden?: boolean;
}

// 修改ModelSelect组件，添加精确的泛型类型
const ModelSelect: React.FC<{
  value: ChatModel;
  onChange: (value: ChatModel) => void;
}> = ({ value, onChange }) => (
  <Select<ChatModel>
    style={{ width: 150 }}
    value={value}
    onChange={onChange}
    options={[
      { value: 'deepseek', label: 'Deepseek' },
      { value: 'gpt4', label: 'GPT-4' },
    ]}
  />
);

// 修改HistoryList组件，添加精确的泛型类型
const HistoryList: React.FC<{
  data: LocalHistoryItem[];
  onSelect: (item: LocalHistoryItem) => void;
  onDelete: (id: string) => void;
}> = ({ data, onSelect, onDelete }) => (
  <List<LocalHistoryItem>
    itemLayout="horizontal"
    dataSource={data}
    renderItem={(item) => (
      <StyledListItem onClick={() => onSelect(item)}>
        <StyledListItemMeta
          avatar={<Avatar icon={<MessageOutlined />} />}
          title={item.title}
          description={`${item.lastMessage?.substring(0, 50)}${item.lastMessage?.length > 50 ? '...' : ''}`}
        />
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
        />
      </StyledListItem>
    )}
  />
);

const TextChat: React.FC = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<ChatModel>('gpt4');
  const [chatStarted, setChatStarted] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<LocalHistoryItem[]>([]);
  
  // 使用ref来存储消息，避免闭包问题
  const messagesRef = useRef<ExtendedMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  
  // 组件加载时检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      console.log('检查认证状态:', isAuthenticated, token);
      
      if (!isAuthenticated || !token) {
        message.warning('请先登录');
        navigate('/login');
        return;
      }
      
      // 存储token到API配置中
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('已设置API请求头的Authorization:', `Bearer ${token.substring(0, 10)}...`);
    };
    
    checkAuth();
  }, [isAuthenticated, token, navigate]);

  // 添加选中消息的状态
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // 修改handleStartChat函数
  const handleStartChat = async (contents: string[], selectedModel: ChatModel) => {
    console.log('开始新的对话');
    setChatStarted(true);
    setLoading(true);
    setModel(selectedModel);
    
    try {
      // 清空现有消息
      setMessages(prev => [{
        id: '0',
        role: 'user',
        // content: contents[0],
        content: contents[0] + '回答请控制在150字以内',
        timestamp: new Date().toISOString(),
        hidden: false, // 添加hidden属性，表示不显示
        parentId: undefined
      }]);
      await sleep(500);
      
      // 创建5个独立的对话
      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];
        
        // 添加用户消息（但不显示）
        const userMessage: ExtendedMessage = {
          id: uuidv4(),
          role: 'user',
          // content: content,
          content: content + '回答请控制在150字以内',
          timestamp: new Date().toISOString(),
          hidden: true, // 添加hidden属性，表示不显示
          parentId: undefined
        };
        
        // 添加初始的助手消息
        const assistantMessage: ExtendedMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          isStreaming: true,
          parentId: '0',
          model: selectedModel,
        };
        
        // 添加消息到列表
        setMessages(prev => [...prev, userMessage, assistantMessage]);
        
        // 准备请求数据
        const requestData = {
          messages: [
            ...messagesRef.current.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            })),
            {
              role: 'user',
              // content,
              content: content + '回答请控制在150字以内',
              timestamp: userMessage.timestamp
            }
          ],
          model: selectedModel,
          id: assistantMessage.id,
          parentId: '0'
        };
        
        // 发送请求
        const response = await fetch('/api/chat/text/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 流式传输处理逻辑
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }
        
        // 读取流式数据
        const decoder = new TextDecoder();
        let done = false;
        const accumulator = { content: '' };
        
        // 创建一个更新UI的函数
        const updateUI = throttle((content: string) => {
          setMessages(prev => {
            const newMessages = [...prev];
            // const lastMessage = newMessages[newMessages.length - 1];
            const lastMessage = newMessages.find(msg => msg.id === assistantMessage.id);
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = content;
            }
            return newMessages;
          });
        }, 500);
        
        // 流式读取响应
        try {
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            
            if (value) {
              const text = decoder.decode(value, { stream: !done });
              // console.log('收到数据块:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
              
              // 处理SSE数据
              const lines = text.split('\n').filter(line => line.trim() !== '');
              
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  try {
                    const jsonStr = line.substring(5).trim();
                    if (jsonStr === '[DONE]') {
                      console.log('收到完成标志');
                      continue;
                    }
                    
                    const jsonData = JSON.parse(jsonStr);
                    
                    if (jsonData.error) {
                      console.error('服务器返回错误:', jsonData.error);
                      throw new Error(jsonData.error);
                    }
                    
                    if (jsonData.content) {
                      accumulator.content += jsonData.content;
                      // console.log('累积内容长度:', accumulator.content.length);
                      // 立即更新UI
                      updateUI(accumulator.content);
                    }
                  } catch (e) {
                    console.error('解析SSE数据失败:', e, line);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('流式读取过程中出错:', error);
        } finally {
          // 流式传输完成后，更新最后一条消息的状态
          setMessages(prev => {
            const newMessages = [...prev];
            // const lastMessage = newMessages[newMessages.length - 1];
            const lastMessage = newMessages.find(msg => msg.id === assistantMessage.id);
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.isStreaming = false;
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('开始对话失败:', error);
      message.error('开始对话失败');
    } finally {
      setLoading(false);
    }
  };

  // 定义一个睡眠函数
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // 发送新消息
  const handleSendMessage = async (content: string, regenerateFlag?: boolean, parentId?: string, id?: string) => {
    if ((!selectedMessageId || !content.trim()) && !regenerateFlag) return;
    
    console.log('开始发送消息');
    setLoading(true);
    
    const regenerateIndex = messagesRef.current.findIndex(obj => obj.id === parentId);
    const regenerateRequestData = {
      messages: messagesRef.current.slice(0, regenerateIndex + 1),
      model: model,
      id,
      parentId
    };
    console.log( 'messages', messages, 'messagesRef.current', messagesRef.current, 'regenerateIndex', regenerateIndex, 'messagesRef.current.slice(0, regenerateIndex + 1)', messagesRef.current.slice(0, regenerateIndex + 1));
    // 添加用户消息
    const userMessage: ExtendedMessage = {
      id: uuidv4(),
      role: 'user',
      content: content,
      // content: content + '回答请控制在150字以内',
      timestamp: new Date().toISOString(),
      parentId: selectedMessageId
    };

    if (!regenerateFlag) {
      setMessages(prev => [...prev, userMessage]);
      await sleep(500);
    }
    
    // 添加初始的助手消息
    const assistantMessage: ExtendedMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
      parentId: userMessage.id,
      model: model,
    };
    
    if (!regenerateFlag) {
      // 如果选择了消息，将新消息插入到选中消息之后
      if (selectedMessageId) {
        setMessages(prev => {
          const index = prev.findIndex(msg => msg.id === selectedMessageId);
          if (index === -1) return [...prev, assistantMessage];
          // return [
          //   ...prev.slice(0, index + 1),
          //   assistantMessage,
          //   ...prev.slice(index + 1)
          // ];
          return [...prev, assistantMessage];
        });
      } else {
        setMessages(prev => [...prev, assistantMessage]);
      }
    }
    
    try {
      // 准备请求数据
      const requestData = {
        messages: [
          ...messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          })),
          { 
            id: userMessage.id,
            role: 'user',
            // content, 
            content: content + '回答请控制在150字以内',
            timestamp: userMessage.timestamp,
            parentId: selectedMessageId
          }
        ],
        model: model,
        id: assistantMessage.id,
        parentId: userMessage.id
      };
      
      console.log('准备发送流式请求');
      // 使用fetch API直接发送请求
      const response = await fetch('/api/chat/text/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(regenerateFlag ? regenerateRequestData : requestData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 流式传输处理逻辑
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }
      
      // 读取流式数据
      const decoder = new TextDecoder();
      let done = false;
      const accumulator = { content: '' };
      
      // 创建一个更新UI的函数
      const updateUI = throttle((content: string) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const index = prev.findIndex(msg => msg.id === selectedMessageId);
          // const lastMessage = newMessages[index + 2];
          const lastMessage = newMessages.find(msg => msg.id === (regenerateFlag ? id : assistantMessage.id));
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = content;
          }
          return newMessages;
        });
      }, 500);
      
      // 流式读取响应
      try {
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            const text = decoder.decode(value, { stream: !done });
            // console.log('收到数据块:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
            
            // 处理SSE数据
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data:')) {
                try {
                  const jsonStr = line.substring(5).trim();
                  if (jsonStr === '[DONE]') {
                    console.log('收到完成标志');
                    continue;
                  }
                  
                  const jsonData = JSON.parse(jsonStr);
                  
                  if (jsonData.error) {
                    console.error('服务器返回错误:', jsonData.error);
                    throw new Error(jsonData.error);
                  }
                  
                  if (jsonData.content) {
                    accumulator.content += jsonData.content;
                    // console.log('累积内容长度:', accumulator.content.length);
                    // 立即更新UI
                    updateUI(accumulator.content);
                  }
                } catch (e) {
                  console.error('解析SSE数据失败:', e, line);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('流式读取过程中出错:', error);
      } finally {
        // 流式传输完成后，更新最后一条消息的状态
        setMessages(prev => {
          const newMessages = [...prev];
          const index = prev.findIndex(msg => msg.id === selectedMessageId);
          // const lastMessage = newMessages[index + 2];
          const lastMessage = newMessages.find(msg => msg.id === (regenerateFlag ? id : assistantMessage.id));
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.isStreaming = false;
          }
          return newMessages;
        });
        setLoading(false); // 流式传输完成时设置loading为false
        setSelectedMessageId(null);
      }
      
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败');
      // 更新最后一条消息状态
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = regenerateFlag ? newMessages[regenerateIndex] : newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.isStreaming = false;
          lastMessage.error = true;
        }
        return newMessages;
      });
      setLoading(false); // 捕获到异常时设置loading为false
      setSelectedMessageId(null);
    }
  };
  
  // 重新生成最后一条助手消息
  const handleRegenerateMessage = async (message: ExtendedMessage) => {
    const parentMessage = messagesRef.current.find(item => item.id === message.parentId);
    console.log('message', message, 'messages', messages, 'messagesRef.current', messagesRef.current, 'parentMessage', parentMessage);
    
    if (parentMessage) {
      // 重新生成回复
      await handleSendMessage(parentMessage.content, true, message.parentId, message.id);
    }
  };
  
  // 开始新的对话
  const handleNewChat = () => {
    setChatStarted(false);
    setMessages([]);
    messagesRef.current = [];
  };

  const handleModelChange = (value: ChatModel) => {
    setModel(value);
  };

  const handleSelectHistory = (item: LocalHistoryItem) => {
    console.log('选择历史记录:', item);
    // TODO: 实现加载历史对话的功能
  };

  const handleDeleteHistory = (id: string) => {
    console.log('删除历史记录:', id);
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleClearHistory = () => {
    console.log('清空所有历史记录');
    setHistory([]);
  };

  // 服务端返回的错误handler
  const handleStreamError = (error: Error) => {
    console.error('流式请求错误:', error);
    message.error('获取回复失败，请重试');
    
    // 更新消息列表，显示错误
    setMessages(prevMessages => {
      const updatedMessages = [...prevMessages];
      const lastMessageIndex = updatedMessages.length - 1;
      
      if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].role === 'assistant') {
        updatedMessages[lastMessageIndex] = {
          ...updatedMessages[lastMessageIndex],
          content: '回复生成失败，请重试。',
          isStreaming: false,
          error: true
        };
      } else {
        // 如果最后一条不是助手消息，添加一条错误消息
        updatedMessages.push({
          id: uuidv4(),
          role: 'assistant',
          content: '回复生成失败，请重试。',
          timestamp: new Date().toISOString(),
          error: true
        });
      }
      
      return updatedMessages;
    });
  };
 
  // 解析SSE数据行
  const parseSSEData = (line: string, accumulator: { content: string }) => {
    if (!line.startsWith('data:')) return false;
    
    try {
      // 去掉 "data: " 前缀并解析JSON
      const jsonStr = line.substring(5).trim();
      if (jsonStr === '[DONE]') {
        console.log('收到完成标志');
        return true;
      }
      
      // 尝试解析JSON
      const jsonData = JSON.parse(jsonStr);
      
      if (jsonData.error) {
        console.error('服务器返回错误:', jsonData.error);
        throw new Error(jsonData.error);
      }
      
      // 检查是否有内容更新
      if (jsonData.content) {
        console.log('收到内容更新:', jsonData.content);
        accumulator.content += jsonData.content;
        return true;
      } else if (jsonData.done) {
        console.log('收到完成信号');
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('解析SSE数据失败:', e, line);
      return false;
    }
  };
  
  // 处理SSE数据块
  const processSSEChunk = (text: string, accumulator: { content: string }) => {
    console.log('处理数据块:', text);
    // 处理SSE格式的数据
    const lines = text.split('\n').filter(line => line.trim() !== '');
    let updated = false;
    
    for (const line of lines) {
      if (parseSSEData(line, accumulator)) {
        updated = true;
      }
    }
    
    return updated;
  };

  // 添加选择消息的处理函数
  const handleSelectMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  return (
    <ChatContainer>
      <Button
        style={{ position: 'absolute', top: 20, right: 40, zIndex: 10 }}
        onClick={() => navigate('/image-gen')}
      >
        跳转到生图功能
      </Button>
      {showHistory && (
        <HistorySidebar>
          <HistoryHeader>
            <h3>历史记录</h3>
            <Button type="text" danger onClick={handleClearHistory}>清空历史</Button>
          </HistoryHeader>
          <HistoryList 
            data={history} 
            onSelect={handleSelectHistory} 
            onDelete={handleDeleteHistory} 
          />
        </HistorySidebar>
      )}
      
      <ChatPanel>
        <ChatHeader>
          <Button 
            type="text"
            icon={<MessageOutlined />}
            onClick={() => setShowHistory(!showHistory)}
          />
          <ModelSelect value={model} onChange={handleModelChange} />
        </ChatHeader>
        
        {!chatStarted ? (
          <InitialChat onStartChat={handleStartChat} />
        ) : (
          <ChatContent 
            messages={messages}
            onSendMessage={handleSendMessage}
            onRegenerateMessage={handleRegenerateMessage}
            loading={loading}
            onNewChat={handleNewChat}
            onSelectMessage={handleSelectMessage}
            selectedMessageId={selectedMessageId}
          />
        )}
      </ChatPanel>
    </ChatContainer>
  );
};

export default TextChat; 