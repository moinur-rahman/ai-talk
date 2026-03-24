import { configureStore } from '@reduxjs/toolkit';
import modelReducer from './slices/modelSlice';
import chatReducer from './slices/chatSlice';
import { chatApi } from '@/services/chatApi';
import { modelApi } from '@/services/modelApi';
import { fileApi } from '@/services/fileApi';
import { userApi } from '@/services/userApi';
import { projectApi } from '@/services/projectApi';
import { imageGenerationApi } from '@/services/imageGenerationApi';
import { audioApi } from '@/services/audioApi';

export const store = configureStore({
  reducer: {
    model: modelReducer,
    chat: chatReducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [modelApi.reducerPath]: modelApi.reducer,
    [fileApi.reducerPath]: fileApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [imageGenerationApi.reducerPath]: imageGenerationApi.reducer,
    [audioApi.reducerPath]: audioApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(chatApi.middleware)
      .concat(modelApi.middleware)
      .concat(fileApi.middleware)
      .concat(userApi.middleware)
      .concat(projectApi.middleware)
      .concat(imageGenerationApi.middleware)
      .concat(audioApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
