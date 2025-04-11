import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  parentId?: string;
}

interface Conversation {
  id: string;
  messages: Message[];
  model: 'deepseek' | 'GPT-4o';
  title: string;
  createdAt: number;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<string>) => {
      state.currentConversationId = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
      state.currentConversationId = action.payload.id;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.messages.push(action.payload.message);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    regenerateMessage: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        const messageIndex = conversation.messages.findIndex(m => m.id === action.payload.messageId);
        if (messageIndex !== -1) {
          conversation.messages = conversation.messages.slice(0, messageIndex + 1);
        }
      }
    },
  },
});

export const {
  setCurrentConversation,
  addConversation,
  addMessage,
  setLoading,
  setError,
  regenerateMessage,
} = chatSlice.actions;

export default chatSlice.reducer; 