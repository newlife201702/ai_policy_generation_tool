// 消息角色类型
export type MessageRole = 'user' | 'bot' | 'assistant';

// 聊天消息接口
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  error?: boolean;
  isStreaming?: boolean;
}

// 历史记录项接口
export interface HistoryItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  model: 'deepseek' | 'gpt4';
}

// 聊天模型类型
export type ChatModel = 'deepseek' | 'gpt4';

// 聊天操作类型
export enum ChatActionType {
  ADD_MESSAGE = 'ADD_MESSAGE',
  UPDATE_MESSAGE = 'UPDATE_MESSAGE',
  CLEAR_MESSAGES = 'CLEAR_MESSAGES',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_MODEL = 'SET_MODEL',
  ADD_HISTORY = 'ADD_HISTORY',
  DELETE_HISTORY = 'DELETE_HISTORY',
  SET_HISTORY = 'SET_HISTORY'
}

// 聊天状态接口
export interface ChatState {
  messages: Message[];
  history: HistoryItem[];
  isLoading: boolean;
  error: string | null;
  currentModel: ChatModel;
}

// 聊天操作接口
export interface ChatAction {
  type: ChatActionType;
  payload?: any;
}

export interface ChatResponse {
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  messages: Message[];
  model: 'deepseek' | 'gpt4';
} 