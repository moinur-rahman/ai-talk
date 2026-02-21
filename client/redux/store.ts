import { configureStore } from "@reduxjs/toolkit";
import modelReducer from "./slices/modelSlice";
import chatReducer from "./slices/chatSlice";
import { chatApi } from "@/services/chatApi";
import { modelApi } from "@/services/modelApi";
import { fileApi } from "@/services/fileApi";

export const store = configureStore({
  reducer: {
    model: modelReducer,
    chat: chatReducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [modelApi.reducerPath]: modelApi.reducer,
    [fileApi.reducerPath]: fileApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(chatApi.middleware)
      .concat(modelApi.middleware)
      .concat(fileApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
