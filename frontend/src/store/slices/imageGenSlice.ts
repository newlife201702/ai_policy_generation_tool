import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Image {
  id: string;
  prompt: string;
  url: string;
  timestamp: number;
  model: 'GPT-4o';
  type: 'text2img' | 'img2img';
  sourceImage?: string;
}

interface Conversation {
  id: string;
  images: Image[];
  title: string;
  createdAt: number;
}

interface ImageGenState {
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ImageGenState = {
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
};

const imageGenSlice = createSlice({
  name: 'imageGen',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<string>) => {
      state.currentConversationId = action.payload;
    },
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
      state.currentConversationId = action.payload.id;
    },
    addImage: (state, action: PayloadAction<{ conversationId: string; image: Image }>) => {
      const conversation = state.conversations.find(c => c.id === action.payload.conversationId);
      if (conversation) {
        conversation.images.push(action.payload.image);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCurrentConversation,
  addConversation,
  addImage,
  setLoading,
  setError,
} = imageGenSlice.actions;

export default imageGenSlice.reducer; 