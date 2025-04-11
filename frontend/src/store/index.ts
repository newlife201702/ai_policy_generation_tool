import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import imageGenReducer from './slices/imageGenSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    imageGen: imageGenReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store; 